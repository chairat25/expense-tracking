import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "บันทึกรายรับรายจ่าย",
    short_name: "รายรับรายจ่าย",
    description: "จดรายรับรายจ่ายรายวัน สรุปยอดสิ้นเดือน",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0e12",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
