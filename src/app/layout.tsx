import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import Onboarding from "@/components/Onboarding";

const notoThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "บันทึกรายรับรายจ่าย",
  description: "จดรายรับรายจ่ายรายวัน สรุปยอดสิ้นเดือน",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0e12" },
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
    <html lang="th" className={`${notoThai.variable} h-full antialiased`} suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col relative"
        style={{ fontFamily: "var(--font-thai), system-ui, sans-serif" }}
        suppressHydrationWarning
      >
        {children}
        <PwaInstallPrompt />
        <Onboarding />
      </body>
    </html>
  );
}
