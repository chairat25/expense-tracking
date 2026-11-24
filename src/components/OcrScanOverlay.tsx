import clsx from "clsx";

interface OcrScanOverlayProps {
  active: boolean;
  compact?: boolean;
}

/**
 * Viewfinder corners and sweeping laser-beam overlay shown over a receipt thumbnail during OCR.
 */
export function OcrScanOverlay({ active, compact = false }: OcrScanOverlayProps) {
  if (!active) return null;

  const cornerSize = compact ? "h-2 w-2" : "h-2.5 w-2.5";
  const bracketInset = compact ? "inset-1" : "inset-1.5";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] bg-indigo-950/35"
    >
      {/* Viewfinder corner brackets */}
      <div className={clsx("absolute", bracketInset)}>
        <span
          className={clsx(
            "absolute left-0 top-0 rounded-tl-sm border-l-2 border-t-2 border-emerald-400",
            cornerSize
          )}
        />
        <span
          className={clsx(
            "absolute right-0 top-0 rounded-tr-sm border-r-2 border-t-2 border-emerald-400",
            cornerSize
          )}
        />
        <span
          className={clsx(
            "absolute bottom-0 left-0 rounded-bl-sm border-b-2 border-l-2 border-emerald-400",
            cornerSize
          )}
        />
        <span
          className={clsx(
            "absolute bottom-0 right-0 rounded-br-sm border-b-2 border-r-2 border-emerald-400",
            cornerSize
          )}
        />
      </div>

      {/* Sweeping laser beam track */}
      <div className="absolute inset-x-0 top-1 bottom-1">
        <div className="ocr-scan-beam absolute inset-0">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
            <div className="h-5 w-full bg-gradient-to-b from-transparent via-emerald-400/30 to-transparent" />
            <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.85)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
