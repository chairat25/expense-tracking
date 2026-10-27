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
  appleWebApp: {
    capable: true,
    title: "Expense Tracking",
  },
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
            __html: `(function(){try{var m=localStorage.getItem('expense_theme_mode')||'system';var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.setAttribute('data-theme',d?'dark':'light');if(d){r.classList.add('dark')}else{r.classList.remove('dark')}var c=d?'#020617':'#ffffff';var s=d?'black-translucent':'default';var metas=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<metas.length;i++){metas[i].removeAttribute('media');metas[i].setAttribute('content',c)}var appleMeta=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');if(!appleMeta){appleMeta=document.createElement('meta');appleMeta.name='apple-mobile-web-app-status-bar-style';document.head.appendChild(appleMeta)}appleMeta.setAttribute('content',s)}catch(e){}})()`,
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
