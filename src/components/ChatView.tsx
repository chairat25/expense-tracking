"use client";

import { useEffect, useState } from "react";
import {
  MessageCircle,
  Search,
  User,
  ShieldCheck,
  Sparkles,
  Clock,
  Send,
  Loader2,
  Users,
} from "lucide-react";
import DirectChatModal from "./DirectChatModal";

type ConversationItem = {
  userId: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  isOnline: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unread?: boolean;
};

type CommunityUser = {
  userId: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  isOnline: boolean;
};

export default function ChatView() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [communityUsers, setCommunityUsers] = useState<CommunityUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Active Chat Modal State
  const [activeChatFriend, setActiveChatFriend] = useState<CommunityUser | null>(
    null,
  );

  useEffect(() => {
    let isCancelled = false;

    async function loadChatData() {
      setLoading(true);
      try {
        const [resConv, resComm] = await Promise.all([
          fetch("/api/chat/conversations"),
          fetch("/api/community/users"),
        ]);

        if (resConv.ok) {
          const dConv = await resConv.json();
          if (!isCancelled && Array.isArray(dConv.conversations)) {
            setConversations(dConv.conversations);
          }
        }

        if (resComm.ok) {
          const dComm = await resComm.json();
          if (!isCancelled && Array.isArray(dComm.users)) {
            setCommunityUsers(dComm.users);
          }
        }
      } catch (err) {
        console.error("Failed to load chat conversations", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    void loadChatData();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Filter conversations
  const filteredConversations = conversations.filter(
    (c) =>
      c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4 pop-in pb-12">
      {/* 1. Header Banner */}
      <div className="card relative overflow-hidden p-6 bg-gradient-to-br from-indigo-900/50 via-surface to-surface border-indigo-500/30">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 shrink-0">
            <MessageCircle size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">
                แชท & ข้อความ (Messenger)
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-400">
                <Sparkles size={11} /> Realtime Chat
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              แชทพูดคุย ปรึกษาเรื่องการจัดสรรเงินและออมเงินกับเพื่อนร่วมคอมมูนิตี้
            </p>
          </div>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหารายชื่อเพื่อน หรือข้อความสนทนา..."
          className="w-full rounded-2xl border border-border bg-surface pl-10 pr-4 py-3 text-xs text-foreground placeholder:text-muted outline-none focus:border-indigo-500/60 transition shadow-xs"
        />
      </div>

      {/* 3. Recent Conversations List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} className="text-indigo-400" />
            <span>บทสนทนาล่าสุด ({filteredConversations.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="card flex items-center justify-center p-12 text-muted text-xs gap-2">
            <Loader2 size={16} className="animate-spin text-indigo-400" />
            <span>กำลังโหลดรายการแชท...</span>
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="space-y-2">
            {filteredConversations.map((item) => (
              <div
                key={item.userId}
                onClick={() =>
                  setActiveChatFriend({
                    userId: item.userId,
                    displayName: item.displayName,
                    avatarUrl: item.avatarUrl,
                    bio: item.bio,
                    isOnline: item.isOnline,
                  })
                }
                className="card flex items-center justify-between p-3.5 transition hover:border-indigo-500/50 hover:bg-surface-2 cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    {item.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt={item.displayName}
                        className="size-12 rounded-2xl object-cover border border-indigo-500/40 shadow-xs"
                      />
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
                        <User size={20} />
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 border-2 border-surface" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-foreground truncate">
                        {item.displayName}
                      </h4>
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-400">
                        <ShieldCheck size={10} /> ยืนยันแล้ว
                      </span>
                    </div>
                    <p className="text-[11px] text-muted truncate max-w-xs">
                      {item.lastMessage}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                  <span className="text-[10px] text-muted font-mono">
                    {new Date(item.lastMessageTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs transition active:scale-95"
                  >
                    <Send size={12} />
                    <span>ทักแชท</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center p-8 space-y-2">
            <p className="text-xs font-medium text-muted">
              ยังไม่มีบทสนทนาย้อนหลังในขณะนี้
            </p>
            <p className="text-[11px] text-muted">
              คุณสามารถเลือกทักแชทหาเพื่อนในคอมมูนิตี้ด้านล่างได้ทันที!
            </p>
          </div>
        )}
      </div>

      {/* 4. Community Members List (To start new chats) */}
      <div className="space-y-3 pt-4">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
          <Users size={14} className="text-indigo-400" />
          <span>เพื่อนร่วมคอมมูนิตี้การเงิน ({communityUsers.length})</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {communityUsers.map((usr) => (
            <div
              key={usr.userId}
              onClick={() => setActiveChatFriend(usr)}
              className="card flex items-center justify-between p-3 transition hover:border-indigo-500/50 hover:bg-surface-2 cursor-pointer active:scale-95"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  {usr.avatarUrl ? (
                    <img
                      src={usr.avatarUrl}
                      alt={usr.displayName}
                      className="size-9 rounded-xl object-cover border border-indigo-500/40"
                    />
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 font-bold text-xs border border-indigo-500/30">
                      <User size={16} />
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border-2 border-surface" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate">
                    {usr.displayName}
                  </h4>
                  <p className="text-[10px] text-muted truncate">{usr.bio}</p>
                </div>
              </div>

              <button
                type="button"
                className="flex items-center gap-1 rounded-xl bg-surface-2 border border-border hover:bg-indigo-600 hover:text-white px-2.5 py-1 text-[10px] font-bold text-foreground transition active:scale-95 shrink-0"
              >
                <MessageCircle size={12} />
                <span>ทักแชท</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Direct Chat Modal */}
      {activeChatFriend && (
        <DirectChatModal
          friend={activeChatFriend}
          onClose={() => setActiveChatFriend(null)}
        />
      )}
    </div>
  );
}
