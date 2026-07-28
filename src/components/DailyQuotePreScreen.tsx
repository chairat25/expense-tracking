"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, RefreshCw, Image as ImageIcon, X, Heart } from "lucide-react";
import {
  BACKGROUND_PRESETS,
  DAILY_QUOTES,
  getDailyBackground,
  getDailyQuote,
  type BackgroundItem,
  type QuoteItem,
} from "@/data/dailyQuotes";

export default function DailyQuotePreScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const [quote, setQuote] = useState<QuoteItem | null>(null);
  const [background, setBackground] = useState<BackgroundItem | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [todayStr, setTodayStr] = useState("");

  useEffect(() => {
    // กำหนดวันที่ปัจจุบัน (YYYY-MM-DD)
    const now = new Date();
    const dateKey = now.toISOString().split("T")[0];
    setTodayStr(dateKey);

    // ดึง Quote และ Background ประจำวันตาม Date Hash
    const initialQuote = getDailyQuote(dateKey);
    const initialBg = getDailyBackground(dateKey);
    setQuote(initialQuote);
    setBackground(initialBg);

    // ตรวจสอบใน localStorage ว่าวันนี้เคยแสดงแล้วหรือยัง
    const lastSeenDate = localStorage.getItem("daily_quote_last_seen_date");
    if (lastSeenDate !== dateKey) {
      setIsOpen(true);
    }

    // ฟัง Custom Event "open-daily-quote" สำหรับเปิดใหม่จาก Header/Sidebar
    const handleOpenEvent = () => {
      setIsOpen(true);
    };

    window.addEventListener("open-daily-quote", handleOpenEvent);
    return () => {
      window.removeEventListener("open-daily-quote", handleOpenEvent);
    };
  }, []);

  // ฟังก์ชันปิดหน้า Pre-Screen และบันทึกวันที่เข้าใช้งาน
  const handleEnterApp = () => {
    if (todayStr) {
      localStorage.setItem("daily_quote_last_seen_date", todayStr);
    }
    setIsOpen(false);
  };

  // ฟังก์ชันสุ่มเปลี่ยนคำคมอื่น
  const handleShuffleQuote = () => {
    setIsFading(true);
    setTimeout(() => {
      setQuote((prev) => {
        if (!prev) return DAILY_QUOTES[0];
        const nextIndex = (prev.id % DAILY_QUOTES.length);
        return DAILY_QUOTES[nextIndex];
      });
      setIsFading(false);
    }, 200);
  };

  // ฟังก์ชันสลับภาพพื้นหลัง
  const handleNextBackground = () => {
    setBackground((prev) => {
      if (!prev) return BACKGROUND_PRESETS[0];
      const currentIndex = BACKGROUND_PRESETS.findIndex((bg) => bg.id === prev.id);
      const nextIndex = (currentIndex + 1) % BACKGROUND_PRESETS.length;
      return BACKGROUND_PRESETS[nextIndex];
    });
  };

  if (!isOpen || !quote || !background) return null;

  // ฟอร์แมตวันที่ภาษาไทย (เช่น 29 กรกฎาคม 2026)
  const formattedDateTH = new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-between items-center p-6 text-white overflow-hidden select-none animate-in fade-in duration-500">
      {/* Background Image Layer with Gradient Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
        style={{ backgroundImage: `url(${background.url})` }}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-b ${background.overlayGradient} backdrop-blur-[2px] transition-all duration-700`}
      />

      {/* Top Header Bar */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 text-xs sm:text-sm font-medium text-white/90 shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>พลังใจประจำวัน • {formattedDateTH}</span>
        </div>

        <button
          type="button"
          onClick={handleEnterApp}
          className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 hover:text-white transition active:scale-95 shadow-md"
          title="ปิดและเข้าสู่แอป"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Quote Content Box */}
      <div
        className={`relative z-10 my-auto flex flex-col items-center justify-center max-w-2xl px-4 sm:px-8 text-center transition-all duration-300 ${
          isFading ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        <div className="mb-6 flex size-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-amber-300 shadow-xl">
          <Heart className="w-6 h-6 fill-amber-300/30" />
        </div>

        {/* Text Lines Layout */}
        <div className="space-y-3 sm:space-y-4">
          {quote.text.map((line, idx) => (
            <p
              key={idx}
              className={`font-semibold tracking-wide leading-relaxed drop-shadow-md text-white/95 ${
                line === "และ"
                  ? "text-xs sm:text-sm text-amber-200/90 font-light my-1"
                  : "text-lg sm:text-2xl md:text-3xl font-sans"
              }`}
            >
              {line}
            </p>
          ))}
        </div>

        {quote.author && (
          <p className="mt-6 text-xs sm:text-sm font-medium text-white/70 tracking-wider">
            — {quote.author}
          </p>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-4 pb-4">
        {/* Main Action Button: Enter App */}
        <button
          type="button"
          onClick={handleEnterApp}
          className="group relative w-full flex items-center justify-center gap-3 rounded-2xl bg-white/20 hover:bg-white/30 active:scale-[0.98] backdrop-blur-xl border border-white/40 px-6 py-4 text-base sm:text-lg font-bold text-white shadow-2xl transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-amber-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <span className="relative z-10">เข้าสู่แอปพลิเคชัน</span>
          <ArrowRight className="relative z-10 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>

        {/* Secondary Sub-actions */}
        <div className="flex items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={handleShuffleQuote}
            className="flex items-center gap-2 rounded-xl bg-black/30 hover:bg-black/40 border border-white/15 px-4 py-2 text-xs sm:text-sm font-medium text-white/80 hover:text-white transition active:scale-95 backdrop-blur-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>🔀 สุ่มคำคมอื่น</span>
          </button>

          <button
            type="button"
            onClick={handleNextBackground}
            className="flex items-center gap-2 rounded-xl bg-black/30 hover:bg-black/40 border border-white/15 px-4 py-2 text-xs sm:text-sm font-medium text-white/80 hover:text-white transition active:scale-95 backdrop-blur-md"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>📸 เปลี่ยนบรรยากาศ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
