"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // เช็กว่าแอปถูกเปิดในโหมด standalone (ติดตั้งแล้ว) หรือไม่
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) return;

    // เช็กว่าเป็น iOS หรือไม่
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // สำหรับ iOS ไม่มี beforeinstallprompt เราต้องโชว์เอง (ถ้ายังไม่ได้โหลด)
      // อาจจะหน่วงเวลาสักนิดค่อยโชว์
      const timer = setTimeout(() => {
        const hasDismissed = localStorage.getItem("pwa-prompt-dismissed");
        if (!hasDismissed) {
          setShowPrompt(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }

    // สำหรับ Android / Chrome Desktop
    const handleBeforeInstallPrompt = (e: any) => {
      // ป้องกันไม่ให้ Chrome โชว์ Mini-infobar ดั้งเดิม
      e.preventDefault();
      // เก็บ event ไว้เพื่อเอาไปเรียกใช้ตอนผู้ใช้กดปุ่ม
      setDeferredPrompt(e);
      
      const hasDismissed = localStorage.getItem("pwa-prompt-dismissed");
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // โชว์ Native Prompt ของระบบ
    deferredPrompt.prompt();
    
    // รอผู้ใช้เลือกว่าจะลงหรือไม่
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // บันทึกไว้ว่าจะไม่กวนอีก
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
      <div className="bg-surface border border-border shadow-2xl rounded-2xl p-4 flex items-start gap-4 pop-in">
        <div className="flex-1">
          <h3 className="font-bold text-sm text-text mb-1">ติดตั้งแอปพลิเคชัน</h3>
          {isIOS ? (
            <p className="text-xs text-muted leading-relaxed">
              ติดตั้งลงเครื่องเพื่อการใช้งานที่ลื่นไหล แตะ <Share className="inline w-3 h-3" /> แล้วเลือก <strong>เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)</strong>
            </p>
          ) : (
            <p className="text-xs text-muted leading-relaxed">
              ติดตั้งแอปลงในเครื่องเพื่อใช้งานแบบเต็มจอและสะดวกรวดเร็วขึ้น
            </p>
          )}
          
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="mt-3 bg-accent text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-accent/90 transition"
            >
              ติดตั้งเลย
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-full text-muted hover:bg-surface-2 transition"
          aria-label="ปิด"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
