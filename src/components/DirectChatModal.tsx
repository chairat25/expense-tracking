"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, User, Sparkles, MessageCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type CommunityUser = {
  userId: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  isOnline: boolean;
};

type ChatMessageItem = {
  id?: number;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

type Props = {
  friend: CommunityUser | null;
  onClose: () => void;
};

export default function DirectChatModal({ friend, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const friendId = friend?.userId;

  // 1. Fetch initial chat history
  useEffect(() => {
    if (!friendId) return;

    let isCancelled = false;
    async function loadMessages() {
      setLoading(true);
      try {
        const res = await fetch(`/api/chat/messages?friendId=${friendId}`);
        const data = await res.json();
        if (!isCancelled && data.messages) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Failed to load chat messages", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    void loadMessages();
    return () => {
      isCancelled = true;
    };
  }, [friendId]);

  // 2. Supabase Realtime Subscription for live incoming messages
  useEffect(() => {
    if (!friendId) return;

    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    const supabase = createClient();

    try {
      const channelId = `chat-${friendId}-${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase
        .channel(channelId)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
          },
          (payload) => {
            const newMsg = payload.new as ChatMessageItem;
            if (
              (newMsg.senderId === friendId && newMsg.receiverId) ||
              (newMsg.receiverId === friendId && newMsg.senderId)
            ) {
              setMessages((prev) => [...prev, newMsg]);
            }
          },
        )
        .subscribe();
    } catch (err) {
      console.error("Realtime subscription error in DirectChatModal", err);
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
  }, [friendId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim() || !friendId || sending) return;

    const textToSend = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: friendId,
          content: textToSend,
        }),
      });

      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  }

  if (!friend) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 pop-in">
      <div className="flex h-[85vh] max-h-[600px] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl border border-indigo-500/30 bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 bg-gradient-to-r from-indigo-900/40 via-surface to-surface p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              {friend.avatarUrl ? (
                <img
                  src={friend.avatarUrl}
                  alt={friend.displayName}
                  className="size-10 rounded-2xl object-cover border border-indigo-500/40 shadow-sm"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
                  {friend.displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
              {friend.isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 border-2 border-surface" />
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground">
                {friend.displayName}
              </h3>
              <p className="text-[11px] text-muted truncate max-w-[200px]">
                {friend.bio || "สมาชิกสังคมการเงิน"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl bg-surface-2 text-muted hover:text-foreground transition active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex h-full items-center justify-center text-xs text-muted gap-2">
              <Loader2 className="animate-spin text-indigo-400" size={18} />
              <span>กำลังโหลดข้อความ...</span>
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg, index) => {
              const isMine = msg.senderId !== friend.userId;
              return (
                <div
                  key={index}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                      isMine
                        ? "bg-indigo-600 text-white rounded-br-xs"
                        : "bg-surface-2 text-foreground border border-border/80 rounded-bl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words font-medium">
                      {msg.content}
                    </p>
                    <p
                      className={`text-[9px] mt-1 text-right font-mono ${
                        isMine ? "text-indigo-200" : "text-muted"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-muted space-y-2">
              <MessageCircle size={32} className="text-indigo-400 opacity-60" />
              <p className="text-xs font-semibold text-foreground">
                เริ่มทักทายพูดคุยกับ {friend.displayName}
              </p>
              <p className="text-[11px]">
                แลกเปลี่ยนเทคนิคการออมเงิน คุมงบรายวัน หรือการตั้งเป้าหมายการเงินได้เลย!
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="border-t border-border/80 bg-surface-2/60 p-3 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`พิมพ์ข้อความถึง ${friend.displayName}...`}
            className="flex-1 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs font-medium text-foreground focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95 disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
