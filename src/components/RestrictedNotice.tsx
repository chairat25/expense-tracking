"use client";

import { Sparkles, ArrowLeft, Coffee } from "lucide-react";

type RestrictedNoticeProps = {
  menuTitle?: string;
  buttonText?: string;
  onGoHome?: () => void;
};

export default function RestrictedNotice({
  menuTitle = "เมนูนี้",
  buttonText = "กลับหน้าหลัก",
  onGoHome,
}: RestrictedNoticeProps) {
  return (
    <div className="mx-auto my-8 max-w-md p-4 text-center pop-in">
      <div className="card space-y-5 p-6 border-accent/20 bg-surface shadow-lg rounded-3xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-3xl">
          🌱
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent">
            <Sparkles size={12} /> สบายๆ ชิลๆ
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {menuTitle} กำลังพักผ่อนอยู่น้า
          </h2>
          <p className="text-xs leading-relaxed text-muted px-2">
            เมนูนี้ถูกสลับปิดการแสดงผลไว้ชั่วคราว หากคุณต้องการเข้าใช้งาน
            สามารถทักสะกิดผู้ดูแลระบบเพื่อขอเปิดใช้งานได้ตลอดเวลาเลยครับ 😊
          </p>
        </div>

        <div className="pt-2">
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-xs font-semibold text-white transition hover:brightness-110 active:scale-95 shadow-sm"
            >
              <ArrowLeft size={15} /> {buttonText}
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted/70 pt-1">
          <Coffee size={13} /> ให้ชีวิตประจำวันของคุณเรียบง่ายที่สุด
        </div>
      </div>
    </div>
  );
}
