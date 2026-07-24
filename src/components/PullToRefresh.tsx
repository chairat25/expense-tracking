"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowDown, RefreshCw, Sparkles } from "lucide-react";
import clsx from "clsx";

interface PullToRefreshProps {
  onRefresh?: () => Promise<void> | void;
}

export default function PullToRefresh({ onRefresh }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [hasVibrated, setHasVibrated] = useState(false);

  const startY = useRef<number | null>(null);
  const threshold = 70; // minimum drag distance in px to trigger refresh

  useEffect(() => {
    function handleTouchStart(e: TouchEvent) {
      if (window.scrollY <= 5 && !refreshing) {
        startY.current = e.touches[0].clientY;
        setHasVibrated(false);
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (startY.current === null || refreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0 && window.scrollY <= 5) {
        // Apply rubber-band damping effect
        const distance = Math.min(diff * 0.45, 120);
        setPullDistance(distance);

        // Vibrate when threshold passed for physical tactile feel
        if (distance >= threshold && !hasVibrated) {
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(25);
          }
          setHasVibrated(true);
        }
      } else {
        setPullDistance(0);
      }
    }

    async function handleTouchEnd() {
      if (startY.current === null || refreshing) return;

      startY.current = null;

      if (pullDistance >= threshold) {
        setRefreshing(true);
        setPullDistance(threshold);

        try {
          if (onRefresh) {
            await onRefresh();
          } else {
            // Default: reload page to refresh data & ServiceWorker cache
            window.location.reload();
          }
        } catch (err) {
          console.error("Refresh failed", err);
        } finally {
          setTimeout(() => {
            setRefreshing(false);
            setPullDistance(0);
          }, 600);
        }
      } else {
        setPullDistance(0);
      }
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, refreshing, hasVibrated, onRefresh]);

  if (pullDistance === 0 && !refreshing) return null;

  const isReady = pullDistance >= threshold;
  const rotation = refreshing ? undefined : Math.min(pullDistance * 3.5, 360);

  return (
    <div
      aria-hidden="true"
      style={{
        transform: `translate(-50%, ${Math.min(pullDistance, threshold) * 0.85}px)`,
      }}
      className={clsx(
        "fixed top-3 left-1/2 z-[200] flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-2xl transition-all duration-150 ease-out border border-white/20",
        refreshing
          ? "bg-indigo-600/95 shadow-indigo-500/40"
          : isReady
            ? "bg-emerald-600/95 shadow-emerald-500/40 scale-105"
            : "bg-surface-2/90 text-foreground/90 border-border shadow-lg",
      )}
    >
      <div className="flex items-center justify-center">
        {refreshing ? (
          <RefreshCw size={15} className="animate-spin text-white" />
        ) : isReady ? (
          <Sparkles size={15} className="text-emerald-300 animate-bounce" />
        ) : (
          <ArrowDown
            size={15}
            style={{ transform: `rotate(${rotation}deg)` }}
            className="text-indigo-400 transition-transform duration-75"
          />
        )}
      </div>

      <span>
        {refreshing
          ? "กำลังอัปเดตข้อมูล..."
          : isReady
            ? "ปล่อยเพื่อรีเฟรช"
            : "ดึงลงเพื่อรีเฟรช..."}
      </span>
    </div>
  );
}
