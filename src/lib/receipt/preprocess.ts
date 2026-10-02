export function clampDimensions(
  width: number,
  height: number,
  maxDim = 1200
): { width: number; height: number } {
  if (width <= maxDim && height <= maxDim) return { width, height };
  const ratio = Math.min(maxDim / width, maxDim / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

export async function preprocessImageForOcr(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve("");
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = clampDimensions(img.naturalWidth || img.width, img.naturalHeight || img.height, 1200);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(canvas.toDataURL("image/png"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Contrast enhancement & grayscale conversion
      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          // Standard ITU-R BT.601 luminance formula
          const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          // Slight contrast enhancement
          const contrast = (v - 128) * 1.25 + 128;
          const finalVal = Math.min(255, Math.max(0, contrast));
          d[i] = finalVal;
          d[i + 1] = finalVal;
          d[i + 2] = finalVal;
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (err) {
        console.warn("Canvas ImageData processing skipped", err);
      }

      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}
