"use client";

import { Loader2 } from "lucide-react";



export default function LoadingBackdrop({ open }: { open: boolean }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm pop-in">
      <div className="bg-surface rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl min-w-[200px]">
        <img src="/bMoFy.gif" alt="Loading..." className="w-20 h-20 object-contain" />
        <p className="text-sm font-semibold text-text">กำลังบันทึกข้อมูล...</p>
      </div>
    </div>
  );
}
