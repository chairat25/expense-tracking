"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function Onboarding() {
  useEffect(() => {
    const dismissedForever = localStorage.getItem("tour-dismissed-forever");
    if (dismissedForever === "true") return;

    // เผื่อคนที่เคยได้ key เก่าไปแล้ว (has-seen-tour) ให้ถือว่าเขาดูจบแล้ว
    if (localStorage.getItem("has-seen-tour") === "true") return;

    const todayStr = new Date().toISOString().split("T")[0];
    const lastSeenDate = localStorage.getItem("tour-last-seen-date");
    
    // ถ้าวันนี้เคยกดข้ามไปแล้ว (หรือเคยดูแล้วแต่ยังไม่จบ) จะไม่เด้งซ้ำในวันนี้
    if (lastSeenDate === todayStr) return;

    // หน่วงเวลาเล็กน้อยเพื่อให้หน้าจอ render เสร็จก่อน
    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        nextBtnText: "ต่อไป",
        prevBtnText: "ย้อนกลับ",
        doneBtnText: "เสร็จสิ้น",
        progressText: "สเต็ป {{current}} จาก {{total}}",
        onDestroyStarted: () => {
          if (!driverObj.hasNextStep()) {
            // ถ้าดูจนจบแล้ว ให้ปิดถาวรไปเลย
            localStorage.setItem("tour-dismissed-forever", "true");
            driverObj.destroy();
          } else {
            // ถ้าผู้ใช้กดกากบาท (ปิดกลางคัน)
            if (window.confirm("คุณต้องการปิดคำแนะนำนี้ถาวร (ไม่ให้แสดงอีกเลย) หรือไม่?\n\n- กด OK: เพื่อปิดถาวร\n- กด Cancel: เพื่อพักไว้ก่อน (จะแสดงใหม่ในวันพรุ่งนี้)")) {
              localStorage.setItem("tour-dismissed-forever", "true");
            } else {
              localStorage.setItem("tour-last-seen-date", todayStr);
            }
            driverObj.destroy();
          }
        },
        steps: [
          {
            element: "#tour-month-summary",
            popover: {
              title: "ภาพรวมรายเดือน 📊",
              description: "เช็กภาพรวมของเดือนนี้ ยอดเงินใช้ทั้งหมด และเงินคงเหลือแบบเรียลไทม์",
              side: "bottom",
              align: "center"
            }
          },
          {
            element: "#tour-date-picker",
            popover: {
              title: "เลือกวันที่ 📅",
              description: "สามารถกดที่วันที่เพื่อเปิดปฏิทิน และข้ามไปดูหรือจดย้อนหลังในวันอื่นๆ ได้ทันที",
              side: "bottom",
              align: "center"
            }
          },
          {
            element: "#tour-quick-add",
            popover: {
              title: "บันทึกรายรับ-รายจ่าย ✍️",
              description: "จดรายรับหรือรายจ่ายได้รวดเร็วที่นี่ แค่พิมพ์ตัวเลขแล้วเลือกหมวดหมู่!",
              side: "bottom",
              align: "center"
            }
          },
          {
            element: "#tour-daily-budget",
            popover: {
              title: "เงินเฉลี่ยต่อวัน 💡",
              description: "นี่คือโควตาเงินที่คุณใช้ได้ในแต่ละวัน ระบบจะคำนวณให้อัตโนมัติจากเงินเดือนที่เหลืออยู่ หรือคุณจะกดรูปดินสอเพื่อตั้งเป้าหมายเองก็ได้!",
              side: "top",
              align: "center"
            }
          }
        ]
      });

      driverObj.drive();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
