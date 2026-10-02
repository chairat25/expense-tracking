import { createWorker } from "tesseract.js";
import { preprocessImageForOcr } from "./preprocess";

export async function recognizeReceiptImage(
  file: File | Blob,
  onProgress?: (percent: number, status?: string) => void
): Promise<string> {
  onProgress?.(10, "กำลังเตรียมรูปภาพ...");
  const preprocessedDataUrl = await preprocessImageForOcr(file);

  onProgress?.(25, "กำลังเริ่มต้นตัวอ่านสลิป...");
  const worker = await createWorker(["tha", "eng"], 1, {
    logger: (m: any) => {
      if (m.status === "recognizing text" && typeof m.progress === "number") {
        const pct = Math.min(95, 30 + Math.round(m.progress * 65));
        onProgress?.(pct, "กำลังถอดข้อความ...");
      } else if (m.status === "loading language traineddata") {
        onProgress?.(28, "กำลังดาวน์โหลดโมเดล...");
      }
    },
  });

  try {
    onProgress?.(35, "กำลังอ่านตัวเลขและข้อความ...");
    const ret = await worker.recognize(preprocessedDataUrl);
    onProgress?.(100, "อ่านข้อมูลสำเร็จ");
    return ret.data.text;
  } finally {
    try {
      await worker.terminate();
    } catch (e) {
      console.warn("Failed to cleanly terminate OCR worker", e);
    }
  }
}
