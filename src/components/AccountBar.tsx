"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AccountBar() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  return (
    <div className="card flex items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="text-[11px] text-muted">เข้าสู่ระบบในชื่อ</p>
        <p className="truncate text-[13px]">{email ?? "…"}</p>
      </div>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs text-muted transition hover:bg-expense-soft hover:text-expense active:scale-95"
        >
          <LogOut size={14} />
          ออกจากระบบ
        </button>
      </form>
    </div>
  );
}
