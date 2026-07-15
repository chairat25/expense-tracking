import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import clsx from "clsx";
import { TH_MONTHS, todayKey, shiftMonth } from "@/lib/shared";

type Props = {
  date: string;
  onChange: (date: string) => void;
  onClose: () => void;
};

const SHORT_DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export default function CustomDatePicker({ date, onChange, onClose }: Props) {
  const [viewYm, setViewYm] = useState(date.slice(0, 7));
  
  const [yStr, mStr] = viewYm.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10) - 1; // 0-indexed

  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const firstDayOfWeek = new Date(y, m, 1).getDay(); // 0 (Sun) to 6 (Sat)
  
  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={ref} 
      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-[280px] rounded-2xl bg-surface border border-border shadow-xl p-4 text-text pop-in"
    >
      <button 
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-expense-soft text-muted hover:text-expense transition"
        aria-label="ปิด"
      >
        <X size={16} />
      </button>

      <div className="flex items-center justify-center gap-4 mb-4 mt-1">
        <button 
          type="button"
          onClick={() => setViewYm(shiftMonth(viewYm, -1))} 
          className="p-1.5 rounded-full hover:bg-surface-2 transition text-muted"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-sm w-24 text-center">
          {TH_MONTHS[m]} {y + 543}
        </span>
        <button 
          type="button"
          onClick={() => setViewYm(shiftMonth(viewYm, 1))} 
          className="p-1.5 rounded-full hover:bg-surface-2 transition text-muted"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center text-[11px] font-medium text-muted mb-2">
        {SHORT_DAYS.map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-y-1 gap-x-1 text-center text-[13px]">
        {days.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`} />;
          
          const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isSelected = dateStr === date;
          const isToday = dateStr === todayKey();

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => {
                onChange(dateStr);
                onClose();
              }}
              className={clsx(
                "relative h-8 w-full flex items-center justify-center rounded-full transition font-medium",
                isSelected ? "bg-accent text-white" : "hover:bg-surface-2",
                !isSelected && isToday && "text-accent font-bold"
              )}
            >
              <span className={clsx(isToday && "mb-1")}>{d}</span>
              {isToday && (
                <span 
                  className={clsx(
                    "absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                    isSelected ? "bg-white" : "bg-accent"
                  )} 
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => {
            onChange(todayKey());
            onClose();
          }}
          className="w-full text-[13px] font-semibold text-accent hover:bg-surface-2 rounded-xl py-2 transition"
        >
          เลือกวันนี้
        </button>
      </div>
    </div>
  );
}
