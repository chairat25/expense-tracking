import type * as OrtTypes from "onnxruntime-web";
import {
  DET_MEAN,
  DET_STD,
  countMixedThaiLatin,
  ctcGreedyDecode,
  extractTextBoxes,
  flattenGrayscaleCrop,
  groupBoxesIntoLines,
  parseRecDict,
  type TextBox,
} from "./openthaiUtils";

const MODEL_BASE_PATH = "/models/openthai-ocr";
const ORT_WASM_PATH = "/ort/";
const DET_LIMIT = 1280;
const REC_HEIGHT = 48;
const REC_MAX_WIDTH = 3200;
const MAX_IMAGE_DIM = 2400;

interface LoadedModels {
  ort: typeof OrtTypes;
  det: OrtTypes.InferenceSession;
  rec: OrtTypes.InferenceSession;
  rec2: OrtTypes.InferenceSession;
  chars: string[];
}

let modelsPromise: Promise<LoadedModels> | null = null;

async function getLoadedModels(): Promise<LoadedModels> {
  if (typeof window === "undefined") {
    throw new Error("OpenThai OCR can only run in a browser environment.");
  }

  if (!modelsPromise) {
    modelsPromise = (async () => {
      const ort = await import("onnxruntime-web");
      ort.env.wasm.wasmPaths = ORT_WASM_PATH;
      ort.env.wasm.numThreads = 1;

      const sessionOpts: OrtTypes.InferenceSession.SessionOptions = {
        executionProviders: ["wasm"],
      };

      const [det, rec, rec2, dictText] = await Promise.all([
        ort.InferenceSession.create(`${MODEL_BASE_PATH}/det.onnx`, sessionOpts),
        ort.InferenceSession.create(`${MODEL_BASE_PATH}/rec.onnx`, sessionOpts),
        ort.InferenceSession.create(`${MODEL_BASE_PATH}/rec2.onnx`, sessionOpts),
        fetch(`${MODEL_BASE_PATH}/rec_dict.txt`).then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch OpenThai dictionary (${res.status})`);
          }
          return res.text();
        }),
      ]);

      return {
        ort,
        det,
        rec,
        rec2,
        chars: parseRecDict(dictText),
      };
    })().catch((err) => {
      modelsPromise = null;
      throw err;
    });
  }

  return modelsPromise;
}

async function decodeFileToCanvas(file: File | Blob): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Unable to initialize 2D canvas context.");
  }

  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(bitmap.width, bitmap.height, 1));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return canvas;
    } finally {
      bitmap.close();
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Failed to decode receipt image."));
      el.src = objectUrl;
    });
    const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(img.width, img.height, 1));
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function buildDetTensor(
  ort: typeof OrtTypes,
  origCanvas: HTMLCanvasElement
): {
  tensor: OrtTypes.Tensor;
  origW: number;
  origH: number;
  paddedW: number;
  paddedH: number;
  pad: number;
  rw: number;
  rh: number;
} {
  const origW = origCanvas.width;
  const origH = origCanvas.height;
  const pad = Math.max(8, Math.floor(0.05 * Math.min(origW, origH)));
  const paddedW = origW + 2 * pad;
  const paddedH = origH + 2 * pad;

  const scale = Math.min(DET_LIMIT / Math.max(paddedW, paddedH), 4.0);
  const rw = Math.max(32, Math.round((paddedW * scale) / 32) * 32);
  const rh = Math.max(32, Math.round((paddedH * scale) / 32) * 32);

  const detCanvas = document.createElement("canvas");
  detCanvas.width = rw;
  detCanvas.height = rh;
  const ctx = detCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Unable to create detector preprocessing canvas.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, rw, rh);
  ctx.drawImage(
    origCanvas,
    (pad / paddedW) * rw,
    (pad / paddedH) * rh,
    (origW / paddedW) * rw,
    (origH / paddedH) * rh
  );

  const rgba = ctx.getImageData(0, 0, rw, rh).data;
  detCanvas.width = 0;
  detCanvas.height = 0;

  const planeSize = rw * rh;
  const chw = new Float32Array(3 * planeSize);
  // Detector expects BGR order with ImageNet mean/std normalization
  for (let i = 0; i < planeSize; i++) {
    const p = i * 4;
    const b = rgba[p + 2] / 255.0;
    const g = rgba[p + 1] / 255.0;
    const r = rgba[p] / 255.0;
    chw[i] = (b - DET_MEAN[0]) / DET_STD[0];
    chw[planeSize + i] = (g - DET_MEAN[1]) / DET_STD[1];
    chw[2 * planeSize + i] = (r - DET_MEAN[2]) / DET_STD[2];
  }

  return {
    tensor: new ort.Tensor("float32", chw, [1, 3, rh, rw]),
    origW,
    origH,
    paddedW,
    paddedH,
    pad,
    rw,
    rh,
  };
}

function buildRecTensor(
  ort: typeof OrtTypes,
  origCanvas: HTMLCanvasElement,
  cropCanvas: HTMLCanvasElement,
  box: TextBox
): OrtTypes.Tensor {
  const boxW = Math.max(1, box.x2 - box.x1);
  const boxH = Math.max(1, box.y2 - box.y1);
  const rw = Math.min(REC_MAX_WIDTH, Math.max(1, Math.ceil((REC_HEIGHT * boxW) / boxH)));

  cropCanvas.width = rw;
  cropCanvas.height = REC_HEIGHT;
  const ctx = cropCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Unable to create recognizer crop canvas.");
  }

  ctx.drawImage(origCanvas, box.x1, box.y1, boxW, boxH, 0, 0, rw, REC_HEIGHT);
  const rgba = ctx.getImageData(0, 0, rw, REC_HEIGHT).data;

  const planeSize = rw * REC_HEIGHT;
  const gray = new Uint8Array(planeSize);
  for (let i = 0; i < planeSize; i++) {
    const p = i * 4;
    gray[i] = Math.round(0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2]);
  }

  const flattened = flattenGrayscaleCrop(gray, rw, REC_HEIGHT);
  const chw = new Float32Array(3 * planeSize);
  for (let i = 0; i < planeSize; i++) {
    const norm = (flattened[i] / 255.0 - 0.5) / 0.5;
    chw[i] = norm;
    chw[planeSize + i] = norm;
    chw[2 * planeSize + i] = norm;
  }

  return new ort.Tensor("float32", chw, [1, 3, REC_HEIGHT, rw]);
}

/**
 * Run OpenThai 2.1 OCR-Text purely client-side via ONNX Runtime WebAssembly.
 * Uses `rec.onnx` by default and switches to loopless-font `rec2.onnx` per line when needed.
 */
export async function recognizeWithOpenThai(
  file: File | Blob,
  onProgress?: (percent: number, status?: string) => void
): Promise<string> {
  onProgress?.(10, "กำลังโหลดโมเดล OpenThai 2.1...");
  const { ort, det, rec, rec2, chars } = await getLoadedModels();

  onProgress?.(20, "กำลังเตรียมภาพสลิป...");
  const origCanvas = await decodeFileToCanvas(file);
  const cropCanvas = document.createElement("canvas");

  try {
    onProgress?.(30, "กำลังตรวจจับบรรทัดข้อความ...");
    const { tensor: detTensor, origW, origH, paddedW, paddedH, pad } = buildDetTensor(
      ort,
      origCanvas
    );

    const detInputName = det.inputNames?.[0] ?? "x";
    const detOutputName = det.outputNames?.[0] ?? "fetch_name_0";
    const detResult = await det.run({ [detInputName]: detTensor });
    const detOutTensor = detResult?.[detOutputName];
    if (!detOutTensor) {
      throw new Error("Detector returned empty output.");
    }

    const mapH = Number(detOutTensor.dims?.[2] ?? 0);
    const mapW = Number(detOutTensor.dims?.[3] ?? 0);
    const probMap = detOutTensor.data as Float32Array;

    let boxes = extractTextBoxes(
      probMap,
      mapW,
      mapH,
      origW,
      origH,
      pad,
      paddedW / Math.max(1, mapW),
      paddedH / Math.max(1, mapH)
    );

    if (boxes.length === 0 && origH <= 200 && origW >= 1.5 * origH) {
      boxes = [
        {
          x1: 0,
          y1: 0,
          x2: origW - 1,
          y2: origH - 1,
          width: origW,
          height: origH,
          score: 1,
        },
      ];
    }

    if (boxes.length === 0) {
      return "";
    }

    onProgress?.(55, "กำลังอ่านข้อความในสลิป...");
    const recInputName = rec.inputNames?.[0] ?? "x";
    const recOutputName = rec.outputNames?.[0] ?? "probs";
    const rec2InputName = rec2.inputNames?.[0] ?? "x";
    const rec2OutputName = rec2.outputNames?.[0] ?? "probs";

    const recognized: Array<{ box: TextBox; text: string }> = [];

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      const recTensor = buildRecTensor(ort, origCanvas, cropCanvas, box);

      const recOut = await rec.run({ [recInputName]: recTensor });
      const recProbs = recOut?.[recOutputName];
      if (!recProbs) continue;

      const timeSteps = Number(recProbs.dims?.[1] ?? 0);
      const numClasses = Number(recProbs.dims?.[2] ?? 0);
      let best = ctcGreedyDecode(
        recProbs.data as Float32Array,
        timeSteps,
        numClasses,
        chars
      );

      // Loopless Thai font retry via rec2.onnx when Latin characters mix inside a Thai word
      const mixed1 = countMixedThaiLatin(best.text);
      if (mixed1 >= 1) {
        const rec2Out = await rec2.run({ [rec2InputName]: recTensor });
        const rec2Probs = rec2Out?.[rec2OutputName];
        if (rec2Probs) {
          const t2 = Number(rec2Probs.dims?.[1] ?? 0);
          const c2 = Number(rec2Probs.dims?.[2] ?? 0);
          const alt = ctcGreedyDecode(
            rec2Probs.data as Float32Array,
            t2,
            c2,
            chars
          );
          const mixed2 = countMixedThaiLatin(alt.text);
          if (mixed2 < mixed1 || (mixed2 === mixed1 && alt.confidence > best.confidence)) {
            best = alt;
          }
        }
      }

      if (best.text.trim().length > 0 && best.confidence >= 0.5) {
        recognized.push({ box, text: best.text });
      }

      const pct = 55 + Math.round(((i + 1) / boxes.length) * 37);
      onProgress?.(pct, "กำลังอ่านข้อความในสลิป...");
    }

    onProgress?.(95, "จัดเรียงข้อความ...");
    const fullText = groupBoxesIntoLines(recognized);
    onProgress?.(100, "อ่านข้อมูลสำเร็จ");
    return fullText;
  } finally {
    origCanvas.width = 0;
    origCanvas.height = 0;
    cropCanvas.width = 0;
    cropCanvas.height = 0;
  }
}
