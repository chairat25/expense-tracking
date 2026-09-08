import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import PullToRefresh from "@/components/PullToRefresh";

const notoThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Expense Tracking - บันทึกรายรับรายจ่าย",
  description: "เว็บบันทึกรายรับรายจ่ายรายวัน รวดเร็ว เรียบง่าย",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#020617" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-visual",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${notoThai.variable} h-full antialiased dark`} suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col relative bg-slate-950 text-slate-100"
        style={{ fontFamily: "var(--font-thai), system-ui, sans-serif" }}
        suppressHydrationWarning
      >
        {children}
        <PwaInstallPrompt />
        <PullToRefresh />
      </body>
    </html>
  );
}
