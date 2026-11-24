/**
 * Pure algorithmic utilities for OpenThai 2.1 OCR-Text (PP-OCRv6 tiny det + Thai CTC rec).
 * Kept DOM/Canvas-free so all geometry, flattening, and decoding steps can be unit-tested cleanly.
 */

export const DET_MEAN = [0.485, 0.456, 0.406] as const;
export const DET_STD = [0.229, 0.224, 0.225] as const;

export interface TextBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
  score: number;
}

export interface ExtractBoxesOptions {
  thresh?: number;
  boxThresh?: number;
  unclipRatio?: number;
  minSize?: number;
  maxCandidates?: number;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Parse rec_dict.txt into CTC class table: index 0 is blank, trailing space matches PaddleOCR export. */
export function parseRecDict(dictText: string): string[] {
  const chars = (dictText ?? "")
    .split(/\r?\n/)
    .filter((line) => line.length > 0);
  return ["", ...chars, " "];
}

/** 1D sliding-window median over a uint8 array using a 256-bin histogram in O(n) time. */
function medianBlur1D(src: Uint8Array, windowSize: number): Uint8Array {
  const n = src.length;
  const out = new Uint8Array(n);
  if (n === 0) return out;

  const radius = Math.floor(Math.max(1, windowSize) / 2);
  const hist = new Int32Array(256);

  // Seed histogram for x = 0 across [-radius .. +radius] clamped to [0 .. n - 1]
  for (let i = -radius; i <= radius; i++) {
    hist[src[clamp(i, 0, n - 1)]]++;
  }
  const winCount = 2 * radius + 1;
  const midTarget = Math.floor(winCount / 2);

  for (let x = 0; x < n; x++) {
    let acc = 0;
    let med = 0;
    for (let b = 0; b < 256; b++) {
      acc += hist[b];
      if (acc > midTarget) {
        med = b;
        break;
      }
    }
    out[x] = med;

    if (x + 1 < n) {
      const outIdx = clamp(x - radius, 0, n - 1);
      const inIdx = clamp(x + 1 + radius, 0, n - 1);
      hist[src[outIdx]]--;
      hist[src[inIdx]]++;
    }
  }

  return out;
}

/**
 * Port of OpenThai's `_flatten(g)`: estimates per-column background from top/bottom border rows,
 * takes abs difference from background so both dark-on-light and light-on-dark slips normalize cleanly
 * into dark text on crisp white.
 */
export function flattenGrayscaleCrop(
  gray: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  const total = width * height;
  if (width <= 0 || height <= 0 || gray.length < total) {
    return new Uint8Array(0);
  }

  const k = Math.min(height, Math.max(2, Math.floor(height / 6)));
  const rawBg = new Uint8Array(width);
  const sampleBuf = new Uint8Array(k * 2);

  for (let x = 0; x < width; x++) {
    let cnt = 0;
    for (let y = 0; y < k; y++) {
      sampleBuf[cnt++] = gray[y * width + x];
    }
    for (let y = height - k; y < height; y++) {
      sampleBuf[cnt++] = gray[y * width + x];
    }
    const slice = sampleBuf.subarray(0, cnt).sort();
    rawBg[x] = slice[Math.floor(cnt / 2)];
  }

  const win = Math.max(3, Math.min(height | 1, 255));
  const bg = medianBlur1D(rawBg, win);

  const diff = new Float32Array(total);
  const hist = new Int32Array(256);

  for (let y = 0; y < height; y++) {
    const rowOff = y * width;
    for (let x = 0; x < width; x++) {
      const d = Math.abs(gray[rowOff + x] - bg[x]);
      diff[rowOff + x] = d;
      hist[clamp(Math.floor(d), 0, 255)]++;
    }
  }

  const target98 = 0.98 * total;
  let cum = 0;
  let p98 = 0;
  for (let b = 0; b < 256; b++) {
    cum += hist[b];
    if (cum >= target98) {
      p98 = b;
      break;
    }
  }
  const hi = Math.max(p98, 24);
  const scale = 255.0 / hi;

  const out = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    out[i] = Math.round(255 - clamp(diff[i] * scale, 0, 255));
  }
  return out;
}

/**
 * Connected-component DBNet post-processing on detector probability map `[mapH * mapW]`.
 * Unclips boxes with `area * unclipRatio / perimeter` plus vertical headroom for Thai tone marks.
 */
export function extractTextBoxes(
  prob: Float32Array,
  mapW: number,
  mapH: number,
  origW: number,
  origH: number,
  pad: number,
  scaleX: number,
  scaleY: number,
  opts?: ExtractBoxesOptions
): TextBox[] {
  if (mapW <= 0 || mapH <= 0 || origW <= 0 || origH <= 0 || prob.length < mapW * mapH) {
    return [];
  }

  const thresh = opts?.thresh ?? 0.2;
  const boxThresh = opts?.boxThresh ?? 0.4;
  const unclipRatio = opts?.unclipRatio ?? 1.4;
  const minSize = opts?.minSize ?? 3;
  const maxCandidates = opts?.maxCandidates ?? 3000;

  const total = mapW * mapH;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  const boxes: TextBox[] = [];

  for (let start = 0; start < total; start++) {
    if (visited[start] || prob[start] <= thresh) continue;

    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    visited[start] = 1;

    let minX = start % mapW;
    let maxX = minX;
    let minY = Math.floor(start / mapW);
    let maxY = minY;
    let probSum = 0;
    let count = 0;

    while (head < tail) {
      const idx = queue[head++];
      probSum += prob[idx];
      count++;

      const x = idx % mapW;
      const y = (idx - x) / mapW;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      // 4-connected neighbors
      if (x > 0) {
        const left = idx - 1;
        if (!visited[left] && prob[left] > thresh) {
          visited[left] = 1;
          queue[tail++] = left;
        }
      }
      if (x + 1 < mapW) {
        const right = idx + 1;
        if (!visited[right] && prob[right] > thresh) {
          visited[right] = 1;
          queue[tail++] = right;
        }
      }
      if (y > 0) {
        const up = idx - mapW;
        if (!visited[up] && prob[up] > thresh) {
          visited[up] = 1;
          queue[tail++] = up;
        }
      }
      if (y + 1 < mapH) {
        const down = idx + mapW;
        if (!visited[down] && prob[down] > thresh) {
          visited[down] = 1;
          queue[tail++] = down;
        }
      }
    }

    const compW = maxX - minX + 1;
    const compH = maxY - minY + 1;
    if (Math.min(compW, compH) < minSize) continue;

    const meanScore = probSum / count;
    if (meanScore < boxThresh) continue;

    // DBNet unclip expansion per side + extra vertical headroom for Thai upper vowels/tone marks
    const perim = 2 * (compW + compH);
    const unclip = perim > 0 ? (compW * compH * unclipRatio) / perim : 0;
    const vMargin = (compH + 2 * unclip) * 0.12;

    const x1 = clamp((minX - unclip) * scaleX - pad, 0, origW - 1);
    const x2 = clamp((maxX + 1 + unclip) * scaleX - pad, 0, origW - 1);
    const y1 = clamp((minY - unclip - vMargin) * scaleY - pad, 0, origH - 1);
    const y2 = clamp((maxY + 1 + unclip + vMargin) * scaleY - pad, 0, origH - 1);

    const width = x2 - x1;
    const height = y2 - y1;
    if (width >= 2 && height >= 2) {
      boxes.push({ x1, y1, x2, y2, width, height, score: meanScore });
      if (boxes.length >= maxCandidates) break;
    }
  }

  return boxes;
}

/**
 * Greedy CTC decoder for `[timeSteps, numClasses]` softmax probabilities from rec.onnx / rec2.onnx.
 */
export function ctcGreedyDecode(
  probs: Float32Array,
  timeSteps: number,
  numClasses: number,
  chars: string[]
): { text: string; confidence: number } {
  if (timeSteps <= 0 || numClasses <= 0 || probs.length < timeSteps * numClasses) {
    return { text: "", confidence: 0 };
  }

  let prevId = -1;
  let text = "";
  let confSum = 0;
  let emittedCount = 0;

  for (let t = 0; t < timeSteps; t++) {
    const offset = t * numClasses;
    let bestId = 0;
    let bestProb = probs[offset];
    for (let c = 1; c < numClasses; c++) {
      const p = probs[offset + c];
      if (p > bestProb) {
        bestProb = p;
        bestId = c;
      }
    }

    if (bestId !== 0 && bestId !== prevId) {
      const ch = bestId < chars.length ? chars[bestId] : "";
      if (ch) {
        text += ch;
        confSum += bestProb;
        emittedCount++;
      }
    }
    prevId = bestId;
  }

  return {
    text,
    confidence: emittedCount > 0 ? confSum / emittedCount : 0,
  };
}

/**
 * Count ASCII Latin letters appearing inside words that also contain Thai characters.
 * Triggers fallback from `rec` to loopless-font `rec2` (e.g. "Uาท" -> "บาท").
 */
export function countMixedThaiLatin(text: string): number {
  let count = 0;
  const words = (text ?? "").split(/\s+/);
  for (const word of words) {
    if (!word || !/[\u0E00-\u0E7F]/.test(word)) continue;
    const latinMatches = word.match(/[A-Za-z]/g);
    if (latinMatches) {
      count += latinMatches.length;
    }
  }
  return count;
}

/**
 * Group detected boxes + recognized strings into natural reading lines (top-to-bottom, left-to-right).
 */
export function groupBoxesIntoLines(
  items: Array<{ box: TextBox; text: string }>
): string {
  const valid = (items ?? []).filter((it) => it?.text?.trim().length > 0);
  if (valid.length === 0) return "";

  const heights = valid.map((it) => it.box.height).sort((a, b) => a - b);
  const medianH = heights[Math.floor(heights.length / 2)] || 16;
  const rowTol = Math.max(4, 0.5 * medianH);

  const sorted = [...valid].sort((a, b) => {
    const cyA = (a.box.y1 + a.box.y2) / 2;
    const cyB = (b.box.y1 + b.box.y2) / 2;
    return cyA - cyB;
  });

  const rows: Array<{ anchorCy: number; items: typeof sorted }> = [];
  for (const item of sorted) {
    const cy = (item.box.y1 + item.box.y2) / 2;
    const lastRow = rows[rows.length - 1];
    if (lastRow && Math.abs(cy - lastRow.anchorCy) <= rowTol) {
      lastRow.items.push(item);
      // Smooth row anchor slightly across slightly skewed scans
      const sumCy = lastRow.items.reduce(
        (acc, it) => acc + (it.box.y1 + it.box.y2) / 2,
        0
      );
      lastRow.anchorCy = sumCy / lastRow.items.length;
    } else {
      rows.push({ anchorCy: cy, items: [item] });
    }
  }

  return rows
    .map((row) =>
      row.items
        .sort((a, b) => a.box.x1 - b.box.x1)
        .map((it) => it.text.trim())
        .join(" ")
    )
    .join("\n");
}
