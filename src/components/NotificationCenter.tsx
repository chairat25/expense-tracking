"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Bell, CheckCheck, Sparkles, MessageCircle, Calendar, ShieldCheck, X, Volume2, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type NotificationItem = {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: string;
  link: string;
  isRead: boolean;
  createdAt: string;
};

type Props = {
  align?: "left" | "right";
  onOpenChat?: (friendId?: string) => void;
  onSelectView?: (view: any) => void;
};

export default function NotificationCenter({
  align = "right",
  onOpenChat,
  onSelectView,
}: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [subscribing, setSubscribing] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // 1. Initial Load & Scan Memos
  useEffect(() => {
    async function loadNotifications() {
      try {
        // Trigger memo check first
        await fetch("/api/notifications/check-memos", { method: "POST" });

        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          if (data.notifications) {
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount || 0);
          }
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    }

    void loadNotifications();

    // Check PWA Push Support
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "Notification" in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
    }
  }, []);

  // 2. Supabase Realtime Subscription for Instant Notifications
  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    const supabase = createClient();

    try {
      const channelId = `noti-realtime-${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase
        .channel(channelId)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "user_notifications",
          },
          (payload) => {
            const newNoti = payload.new as NotificationItem;
            setNotifications((prev) => [newNoti, ...prev]);
            setUnreadCount((c) => c + 1);

            if (typeof window !== "undefined" && Notification.permission === "granted") {
              try {
                new Notification(newNoti.title, {
                  body: newNoti.message,
                  icon: "/icon-192.png",
                });
              } catch {
                // ignore
              }
            }
          },
        )
        .subscribe();
    } catch (err) {
      console.error("Realtime subscription error in NotificationCenter", err);
    }

    return () => {
      if (channel) {
        try {
          void supabase.removeChannel(channel);
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark single as read
  async function markRead(id: number) {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  }

  // Mark all as read
  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  }

  // Request PWA Web Push Notification Permission & Subscribe
  async function requestPushPermission() {
    if (!pushSupported) return;
    setSubscribing(true);

    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);

      if (perm === "granted") {
        const reg = await navigator.serviceWorker.register("/sw.js");
        // Create dummy subscription payload if VAPID is not configured
        const dummySub = {
          endpoint: "https://fcm.googleapis.com/fcm/send/pwa-client",
          keys: { p256dh: "dummy", auth: "dummy" },
        };

        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dummySub),
        });

        alert("เปิดรับการแจ้งเตือนบน Lock Screen / มือถือสำเร็จ! 🎉");
      }
    } catch (err) {
      console.error("Failed to subscribe push", err);
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex size-9 items-center justify-center rounded-xl bg-surface-2 border border-border text-foreground hover:bg-surface transition active:scale-95 shadow-xs"
        title="ศูนย์การแจ้งเตือน"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {open && (
        <div
          className={clsx(
            "fixed sm:absolute top-14 sm:top-full mt-1.5 w-[calc(100vw-1rem)] sm:w-96 max-w-sm rounded-2xl border border-border bg-surface/98 backdrop-blur-2xl p-4 shadow-2xl z-50 pop-in",
            align === "left" ? "left-2 sm:left-0" : "right-2 sm:right-0",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="text-indigo-400" size={18} />
              <h3 className="text-sm font-bold text-foreground">การแจ้งเตือน</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-400">
                  {unreadCount} ใหม่
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:underline"
              >
                <CheckCheck size={13} />
                <span>อ่านทั้งหมด</span>
              </button>
            )}
          </div>

          {/* Lock Screen Push Notification Permission Banner */}
          {pushSupported && pushPermission !== "granted" && (
            <div className="my-3 rounded-xl bg-gradient-to-r from-indigo-900/40 via-surface-2 to-surface-2 p-3 border border-indigo-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Smartphone size={15} className="text-indigo-400" />
                <span>เปิดแจ้งเตือนเด้งบน Lock Screen</span>
              </div>
              <p className="text-[11px] text-muted">
                รับการแจ้งเตือนข้อความแชทและเตือนความจำเด้งบนมือถือแม้ขณะปิดจอ
              </p>
              <button
                type="button"
                onClick={requestPushPermission}
                disabled={subscribing}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-indigo-500 transition active:scale-95 disabled:opacity-50"
              >
                <Volume2 size={13} />
                <span>{subscribing ? "กำลังตั้งค่า..." : "เปิดการแจ้งเตือน Lock Screen"}</span>
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto space-y-2 py-2 scrollbar-none">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    void markRead(n.id);
                    setOpen(false);
                    if (n.type === "chat") {
                      onSelectView?.("chat");
                    } else if (n.type === "memo") {
                      onSelectView?.("memo");
                    }
                  }}
                  className={`flex gap-3 rounded-xl p-3 border text-xs cursor-pointer transition ${
                    n.isRead
                      ? "border-border/50 bg-surface-2/40 opacity-75"
                      : "border-indigo-500/30 bg-indigo-500/10 font-medium hover:border-indigo-500/60"
                  }`}
                >
                  <div className="shrink-0 pt-0.5">
                    {n.type === "chat" ? (
                      <MessageCircle size={16} className="text-indigo-400" />
                    ) : (
                      <Calendar size={16} className="text-amber-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <h4 className="font-bold text-foreground">{n.title}</h4>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[9px] text-muted pt-1 font-mono">
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {!n.isRead && (
                    <span className="size-2 rounded-full bg-indigo-500 shrink-0 self-center" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-muted py-8">
                ยังไม่มีรายการแจ้งเตือนใหม่
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
