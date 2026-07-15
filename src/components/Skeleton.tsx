import clsx from "clsx";

/** แท่งเทาพัลส์ ใช้แทนตัวเลข/เนื้อหาระหว่างรอโหลด */
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton", className)} />;
}
