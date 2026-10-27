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
  themeColor: "#020617",
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('expense_theme_mode')||'system';var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.setAttribute('data-theme',d?'dark':'light');if(d){r.classList.add('dark')}else{r.classList.remove('dark')}var color=d?'#020617':'#ffffff';var metas=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<metas.length;i++){metas[i].remove()}var meta=document.createElement('meta');meta.name='theme-color';meta.content=color;document.head.appendChild(meta);var appleMeta=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');if(appleMeta){appleMeta.remove()}}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col relative bg-slate-950 text-slate-100 transition-colors duration-150"
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
