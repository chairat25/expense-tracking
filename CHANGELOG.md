# Changelog & Progress Tracker

บันทึกประวัติการพัฒนาและสถานะความคืบหน้าของโปรเจกต์ Expense Tracking เพื่อการส่งต่องานข้าม Session

---

## [2026-10-15] — Branch: `feat/react-native-mobile`

### ✨ สิ่งที่ทำเสร็จแล้ว (Completed Features)
1. **Gemini Web Automation Bridge (`scripts/gemini_web_coder.js`)**:
   - พัฒนาตัวเชื่อมต่อสั่งการแท็บ Google Gemini บน Chrome โดยตรงผ่าน AppleScript (ใช้โควตา Gemini Advanced บนเว็บได้อย่างคุ้มค่า)
   - ค้นหาแท็บ Gemini อัตโนมัติ, ส่ง Prompt, รอสถานะการเจน, และสกัดบล็อกโค้ด (`<pre><code>`) และเนื้อหากลับมาให้ Agent นำไป implement อัตโนมัติ
2. **Scaffold React Native Expo SDK 52**:
   - ตั้งค่า `package.json` และ `app.json` พร้อมสิทธิ์เข้าถึงรูปภาพ (`NSPhotoLibraryUsageDescription`)
   - ติดตั้ง Dependencies ผ่าน `yarn`: `expo`, `react-native`, `expo-media-library`, `@react-native-async-storage/async-storage`, `lucide-react-native`, `react-native-svg`
3. **Zero-Click Receipt Ingestion (`useRecentReceiptSniffer`)**:
   - พัฒนา Hook ดักจับ `AppState` เมื่อแอปขึ้นสู่หน้าจอหลัก (Foreground) หลังผู้ใช้ทำธุรกรรมในแอปธนาคาร
   - สแกนหาภาพสลิปล่าสุดในเครื่องที่สร้างภายใน 15 นาที และยังไม่เคยถูกบันทึกมาก่อน
4. **Zero-Emoji Mobile UI Components (100% Vector Icons)**:
   - `DateCapsuleBar.tsx`: แถบสลับวันที่ เมื่อวาน / วันนี้ / ปฏิทิน
   - `StatusCard.tsx`: การ์ดสรุปยอดใช้จ่าย รายรับ และงบคงเหลือ
   - `QuickAddForm.tsx`: ฟอร์มบันทึกด่วนใช้ไอคอน Lucide แทน Emoji ตามกฎ Enterprise
   - `AutoReceiptModal.tsx`: หน้าต่างตรวจสลิปอัตโนมัติพร้อมพรีวิวภาพ ให้กดยืนยันบันทึกใน 1 วินาที
5. **Root Entrypoint (`App.tsx`) & Supabase Integration**:
   - รวมทุก Component และเชื่อมต่อกับฐานข้อมูล Supabase ตาราง `transactions`
   - รัน Unit Tests ผ่านครบถ้วน 100% (45 tests across 6 suites)

---

### ⏳ งานที่ค้างอยู่และแผนพัฒนาต่อ (Next Steps)
1. **Slip OCR & Pattern Integration**:
   - เชื่อมต่อตัวถอดรหัสข้อความภาษาไทย/ตัวเลขจากรูปสลิปที่ได้จาก `useRecentReceiptSniffer` ร่วมกับ `src/lib/receipt/parser.ts` และ `patterns.ts`
   - สามารถเรียกใช้ `node scripts/gemini_web_coder.js` ส่งภาพหรือข้อความไปให้ Gemini Web ช่วยวิเคราะห์รูปแบบสลิปใหม่ๆ
2. **การทดสอบบนอุปกรณ์จริง (Device Testing)**:
   - ทดสอบรันผ่าน `yarn start` บน Expo Go (iOS / Android) เพื่อทดสอบการขอสิทธิ์ Photo Library และดึงสลิปจริงหลังโอนเงินในแอปธนาคาร

---

### 📋 Handoff Block (สำหรับการส่งต่องานข้าม Session)
```markdown
[KEYWORD: expense-tracking-react-native-mobile]
- สถานะปัจจุบัน: แตก branch `feat/react-native-mobile` โครงสร้าง Expo SDK 52 + Zero-Click Sniffer + Zero-Emoji UI เสร็จสมบูรณ์และผ่าน 45 tests
- งานถัดไป: เชื่อมต่อ OCR parser เข้ากับรูปภาพสลิปที่ตรวจจับได้ และทดสอบรันแอปบนอุปกรณ์จริงผ่าน Expo
- ตัวช่วยที่มีอยู่: มี `scripts/gemini_web_coder.js` สำหรับสั่งงานแท็บ Gemini บน Chrome ช่วยเขียนโค้ด
- คำสั่งรันโปรเจกต์: `yarn start` (เปิด Expo Dev Server)
- คำสั่งทดสอบ: `yarn test`
- Prompt สำหรับเริ่ม Session ถัดไป:
  "ต่อยอด branch feat/react-native-mobile ของ expense-tracking โดยเชื่อมต่อ OCR parser เข้ากับสลิปที่ตรวจจับได้จาก useRecentReceiptSniffer และใช้ scripts/gemini_web_coder.js ช่วย implement โค้ด"
```
