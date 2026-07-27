"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  MessageCircle,
  Check,
  X,
  Search,
  Clock,
  ShieldCheck,
  Loader2,
  Sparkles,
} from "lucide-react";
import DirectChatModal from "./DirectChatModal";

type CommunityUser = {
  userId: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  status: "none" | "pending_sent" | "pending_received" | "friends";
  friendshipId?: number | null;
};

export default function CommunityView() {
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "discover">("friends");
  const [activeChatFriend, setActiveChatFriend] = useState<CommunityUser | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadCommunity() {
    setLoading(true);
    try {
      const res = await fetch("/api/community/friends");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load community", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCommunity();
  }, []);

  async function handleFriendAction(targetUserId: string, action: "request" | "accept" | "reject" | "unfriend") {
    setProcessingId(targetUserId);
    try {
      const res = await fetch("/api/community/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetUserId }),
      });
      if (res.ok) {
        await loadCommunity();
      }
    } catch (err) {
      console.error("Friend action failed", err);
    } finally {
      setProcessingId(null);
    }
  }

  const friendsList = users.filter((u) => u.status === "friends");
  const requestsList = users.filter((u) => u.status === "pending_received" || u.status === "pending_sent");
  const discoverList = users.filter((u) => u.status === "none");

  const filteredList = (
    activeTab === "friends" ? friendsList : activeTab === "requests" ? requestsList : discoverList
  ).filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.bio.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4 pop-in pb-10">
      {/* Header */}
      <div className="card p-5 border-indigo-500/30 bg-gradient-to-br from-surface via-surface to-indigo-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-1.5">
                <span>Community & เพื่อนผู้ใช้งาน</span>
                <Sparkles size={14} className="text-indigo-400 animate-pulse" />
              </h2>
              <p className="text-xs text-muted">
                ค้นหาเพื่อน แลกเปลี่ยนแนวทาง และแชทคุยกับเพื่อนที่คุณยอมรับคำขอ
              </p>
            </div>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="mt-4 space-y-3 pt-2">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อเพื่อน หรือคำอธิบาย..."
              className="w-full rounded-xl border border-border bg-surface-2/60 pl-9 pr-4 py-2 text-xs text-foreground outline-none focus:border-indigo-500/60"
            />
          </div>

          <div className="flex rounded-xl bg-surface-2/60 p-1 border border-border/60">
            <button
              type="button"
              onClick={() => setActiveTab("friends")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                activeTab === "friends"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-muted hover:text-foreground"
              }`}
            >
              เพื่อนของฉัน ({friendsList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("requests")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition relative ${
                activeTab === "requests"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-muted hover:text-foreground"
              }`}
            >
              คำขอเป็นเพื่อน ({requestsList.length})
              {requestsList.some((r) => r.status === "pending_received") && (
                <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("discover")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                activeTab === "discover"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-muted hover:text-foreground"
              }`}
            >
              ค้นหาผู้ใช้ ({discoverList.length})
            </button>
          </div>
        </div>
      </div>

      {/* User List */}
      {loading ? (
        <div className="flex py-12 items-center justify-center text-muted gap-2 text-xs">
          <Loader2 size={16} className="animate-spin" />
          <span>กำลังโหลดข้อมูลคอมมูนิตี้...</span>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="card py-12 text-center text-xs text-muted space-y-1">
          <p className="font-semibold text-foreground">ไม่พบผู้ใช้งานในหมวดนี้</p>
          <p className="text-[11px]">
            {activeTab === "friends"
              ? "คุณยังไม่มีเพื่อน สามารถค้นหาและส่งคำขอเป็นเพื่อนได้ที่แท็บ 'ค้นหาผู้ใช้'"
              : activeTab === "requests"
                ? "ไม่มีคำขอเป็นเพื่อนค้างอยู่"
                : "ไม่มีผู้ใช้เพิ่มเติมในขณะนี้"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredList.map((u) => (
            <div
              key={u.userId}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3.5 shadow-sm hover:border-indigo-500/40 transition"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                {u.avatarUrl ? (
                  <img
                    src={u.avatarUrl}
                    alt={u.displayName}
                    className="size-11 rounded-2xl object-cover border border-indigo-500/30 shrink-0"
                  />
                ) : (
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30 shrink-0 text-sm">
                    {u.displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-foreground truncate">
                    {u.displayName}
                  </h4>
                  <p className="text-[10px] text-muted truncate">{u.bio}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="shrink-0">
                {u.status === "friends" && (
                  <button
                    type="button"
                    onClick={() => setActiveChatFriend(u)}
                    className="flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-md shadow-indigo-600/20 transition active:scale-95"
                  >
                    <MessageCircle size={13} />
                    <span>💬 ทักแชท</span>
                  </button>
                )}

                {u.status === "none" && (
                  <button
                    type="button"
                    disabled={processingId === u.userId}
                    onClick={() => handleFriendAction(u.userId, "request")}
                    className="flex items-center gap-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 px-3 py-1.5 text-[11px] font-bold text-indigo-400 hover:bg-indigo-500/25 transition active:scale-95 disabled:opacity-50"
                  >
                    <UserPlus size={13} />
                    <span>+ เพิ่มเพื่อน</span>
                  </button>
                )}

                {u.status === "pending_sent" && (
                  <div className="flex items-center gap-1 rounded-xl bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-[10px] font-semibold text-amber-400">
                    <Clock size={12} />
                    <span>รอตอบรับ</span>
                  </div>
                )}

                {u.status === "pending_received" && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={processingId === u.userId}
                      onClick={() => handleFriendAction(u.userId, "accept")}
                      className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition active:scale-95"
                    >
                      <Check size={12} />
                      <span>ยอมรับ</span>
                    </button>
                    <button
                      type="button"
                      disabled={processingId === u.userId}
                      onClick={() => handleFriendAction(u.userId, "reject")}
                      className="rounded-xl border border-border px-2 py-1 text-[11px] font-semibold text-muted hover:bg-surface-2 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Direct Chat Modal - Only opens for accepted friends! */}
      {activeChatFriend && (
        <DirectChatModal
          friend={activeChatFriend}
          onClose={() => setActiveChatFriend(null)}
        />
      )}
    </div>
  );
}
