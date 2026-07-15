"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);

    // สร้าง client ตอนกด ไม่ใช่ตอน render — ไม่งั้น prerender ตอน build จะพังเพราะยังไม่มี env
    const supabase = createClient();
    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${location.origin}/auth/callback`,
            },
          });

    setBusy(false);

    if (error) {
      setError(translate(error.message));
      return;
    }

    if (mode === "signup") {
      setInfo("สมัครแล้ว! เช็กอีเมลเพื่อกดยืนยันก่อนเข้าใช้งาน");
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function google() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setError(translate(error.message));
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10">
      <div className="mb-7 text-center">
        <p className="text-4xl">💰</p>
        <h1 className="mt-2 text-xl font-bold">บันทึกรายรับรายจ่าย</h1>
        <p className="mt-1 text-[13px] text-muted">
          {mode === "signin" ? "เข้าสู่ระบบเพื่อดูข้อมูลของคุณ" : "สร้างบัญชีใหม่"}
        </p>
      </div>

        <button
          onClick={google}
          disabled={busy}
          className="card flex items-center justify-center gap-2.5 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50"
        >
          <GoogleIcon />
          เข้าสู่ระบบด้วย Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[11px] text-muted">หรือใช้อีเมล</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-2.5">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="อีเมล"
            autoComplete="email"
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-sm outline-none focus:border-accent"
          />

          {error && (
            <p className="rounded-xl bg-expense-soft px-3 py-2 text-[13px] text-expense">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-xl bg-income-soft px-3 py-2 text-[13px] text-income">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className={clsx(
              "flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50",
            )}
          >
            {mode === "signin" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </button>
        </form>

      <button
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setInfo(null);
        }}
        className="mt-5 text-center text-[13px] text-muted"
      >
        {mode === "signin" ? (
          <>
            ยังไม่มีบัญชี? <span className="text-accent underline">สมัครสมาชิก</span>
          </>
        ) : (
          <>
            มีบัญชีอยู่แล้ว? <span className="text-accent underline">เข้าสู่ระบบ</span>
          </>
        )}
      </button>

      {/* Loading Backdrop */}
      {busy && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <Loader2 className="animate-spin text-white" size={40} />
          <p className="mt-4 font-medium text-white shadow-black drop-shadow-md">
            กำลังดำเนินการ…
          </p>
        </div>
      )}
    </main>
  );
}

function translate(msg: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    "Email not confirmed": "ยังไม่ได้ยืนยันอีเมล — เช็กกล่องจดหมายก่อน",
    "User already registered": "อีเมลนี้สมัครไว้แล้ว ลองเข้าสู่ระบบแทน",
    "Password should be at least 6 characters":
      "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร",
  };
  return map[msg] ?? msg;
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
