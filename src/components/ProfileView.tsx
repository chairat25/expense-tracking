"use client";

import { useEffect, useRef, useState } from "react";
import {
  User,
  Camera,
  Save,
  Sparkles,
  Users,
  ShieldCheck,
  Check,
  Loader2,
  MessageCircle,
  Award,
} from "lucide-react";
import DirectChatModal from "./DirectChatModal";

type ProfileData = {
  userId: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  updatedAt: string;
  email?: string;
};

type CommunityUser = {
  userId: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  isOnline: boolean;
};

export default function ProfileView() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [friends, setFriends] = useState<CommunityUser[]>([]);

  // Active Chat State
  const [activeChatFriend, setActiveChatFriend] = useState<CommunityUser | null>(
    null,
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load Profile & Friends Data
  useEffect(() => {
    let isCancelled = false;

    async function loadProfile() {
      setLoading(true);
      try {
        const [resProf, resComm] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/community/users"),
        ]);

        if (resProf.ok) {
          const d = await resProf.json();
          if (!isCancelled && d.profile) {
            setProfile(d.profile);
            setDisplayName(d.profile.displayName || "");
            setBio(d.profile.bio || "");
            setAvatarUrl(d.profile.avatarUrl || "");
            setUserEmail(d.email || d.profile.email || "");
          }
        }

        if (resComm.ok) {
          const dComm = await resComm.json();
          if (!isCancelled && dComm.users) {
            setFriends(dComm.users);
          }
        }
      } catch (err) {
        console.error("Failed to load profile data", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Handle File Upload (Image to Base64)
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("กรุณาเลือกไฟล์รูปภาพขนาดไม่เกิน 5 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setAvatarUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  }

  // Save Profile Changes
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          avatarUrl,
        }),
      });

      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setSuccessMsg("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว!");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error("Failed to save profile", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-muted gap-2">
        <Loader2 className="animate-spin text-indigo-400" size={20} />
        <span>กำลังโหลดโปรไฟล์ส่วนตัว...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 pop-in pb-12">
      {/* 1. Header Profile Banner Card */}
      <div className="card relative overflow-hidden p-6 bg-gradient-to-br from-indigo-900/50 via-surface to-surface border-indigo-500/30">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {/* Avatar Container with Upload Trigger */}
          <div className="relative group">
            <div className="relative flex size-24 items-center justify-center rounded-3xl overflow-hidden border-2 border-indigo-500/50 shadow-xl bg-indigo-500/20">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-2xl font-bold text-indigo-300">
                  {displayName ? displayName.slice(0, 2).toUpperCase() : "ME"}
                </div>
              )}
            </div>

            {/* Upload Button Overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-500 transition active:scale-95 border-2 border-surface"
              title="เปลี่ยนรูปโปรไฟล์"
            >
              <Camera size={15} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-foreground">
                {displayName || "ผู้ใช้งาน Expense Tracker"}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                <ShieldCheck size={12} /> สมาชิกยืนยันตัวตน
              </span>
            </div>
            {userEmail && (
              <p className="text-[11px] font-mono text-indigo-400">
                📧 {userEmail}
              </p>
            )}
            <p className="text-xs text-muted max-w-md">
              {bio || "เพิ่มข้อความคติประจำใจหรือเป้าหมายการเงินของคุณ..."}
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-400 font-medium">
          <Check size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Edit Profile Form */}
      <form onSubmit={handleSave} className="card space-y-4 p-5">
        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          <User className="text-indigo-400" size={18} />
          <h3 className="text-sm font-bold text-foreground">
            แก้ไขข้อมูลโปรไฟล์ (Edit Profile)
          </h3>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="text-[11px] font-semibold text-muted">
              ชื่อแสดงผล (Display Name)
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="กรอกชื่อของคุณ"
              className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted">
              ข้อความสโลแกน / เป้าหมายการเงิน (Bio Quote)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="เช่น ออมเงิน 30% ทุกเดือน, คุมงบกินไม่เกินสัปดาห์ละ 1,500 บาท..."
              className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs font-medium text-foreground focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "กำลังบันทึกข้อมูล..." : "บันทึกการเปลี่ยนแปลง"}
            </button>
          </div>
        </div>
      </form>

      {/* 3. Community Friends List */}
      <div className="card space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <Users className="text-indigo-400" size={18} />
            <h3 className="text-sm font-bold text-foreground">
              เพื่อนร่วมคอมมูนิตี้การเงิน ({friends.length})
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {friends.map((f) => (
            <div
              key={f.userId}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface-2/40 p-3 transition hover:border-indigo-500/40"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  {f.avatarUrl ? (
                    <img
                      src={f.avatarUrl}
                      alt={f.displayName}
                      className="size-10 rounded-2xl object-cover border border-indigo-500/30"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
                      {f.displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  {f.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border-2 border-surface" />
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    {f.displayName}
                  </h4>
                  <p className="text-[10px] text-muted truncate max-w-[130px]">
                    {f.bio}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveChatFriend(f)}
                className="flex items-center gap-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 px-3 py-1.5 text-[11px] font-semibold text-indigo-400 hover:bg-indigo-500/25 transition active:scale-95"
              >
                <MessageCircle size={13} />
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
