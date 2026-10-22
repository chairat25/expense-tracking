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
   - รัน Unit Tests ผ่านครบถ้วน 100%
6. **Bank Slip Parser & Auto-Tagging (`src/mobile/lib/slipParser.ts`)**:
   - ยิงโจทย์ให้ Gemini Web ผ่าน `scripts/gemini_web_coder.js` ช่วยออกแบบสถาปัตยกรรม Parser สำหรับสลิปธนาคารไทย (K PLUS, SCB Easy, Krungthai NEXT ฯลฯ)
   - สกัดยอดเงิน, วันที่ (แปลง พ.ศ. เป็น ค.ศ.), และชื่อผู้รับเงิน/ร้านค้า พร้อมจัดหมวดหมู่อัตโนมัติ (อาหาร, เครื่องดื่ม, เดินทาง, บิล, ช้อปปิ้ง) ด้วย Pattern Learning
   - เชื่อมต่อเข้ากับ `AutoReceiptModal` เพื่อ Autocomplete ข้อมูลจากสลิปอัตโนมัติ
   - ชุดทดสอบผ่านครบ 100% (47 tests across 7 test suites)
7. **Enterprise Mobile Security Suite**:
   - **Hardware Secure Storage (`src/mobile/lib/supabase.ts`)**: ย้ายจากการใช้ AsyncStorage ธรรมดามาใช้ `expo-secure-store` (Keychain / Keystore เข้ารหัสระดับ Hardware) สำหรับเก็บ Supabase Auth Session Token ป้องกันการดักขโมยข้อมูล
   - **Biometric Authentication (`src/mobile/context/SecurityContext.tsx`)**: ระบบล็อกแอปด้วย Face ID / สแกนลายนิ้วมือ และรหัสผ่านเครื่อง (Device PIN fallback) พร้อมตั้งเวลาล็อกอัตโนมัติ (Auto-Lock) หากแอปอยู่ใน Background เกิน 60 วินาที
   - **Privacy Shield (`src/mobile/components/PrivacyShield.tsx`)**: แผ่นบังหน้าจออัตโนมัติเมื่อผู้ใช้สลับหน้าจอ (App Switcher / Multitasking) ป้องกันการถูกแอบมองยอดเงินบัญชี และป้องกัน OS ทำ Snapshot หน้าจอติดข้อมูลการเงิน
8. **Native iOS & Android Prebuild & Toolchain Alignment**:
   - ปรับแก้ Version Dependencies ให้ตรงกับ Expo SDK (`react-native@0.86.3`, `react@19.2.3`, `react-native-safe-area-context@5.7.0`, `react-native-svg@15.15.4`)
   - สร้างโปรเจกต์ Native iOS (`ExpenseTracker.xcworkspace`) และ Android สมบูรณ์ พร้อมผูก CocoaPods ครบ 93 pods
   - ตั้งค่า Apple Development Team (`6333JAQ493`) และสิทธิ์ Face ID / Photo Library ใน `app.json` และ `Info.plist`
   - คอมไพล์ Native iOS ผ่าน `xcodebuild` สำเร็จ 100% (Build Succeeded)
   - ชุดทดสอบทั้งหมดยังคงผ่านครบ 100% (47 tests across 7 test suites)

---

### ⏳ วิธีการติดตั้งและรันลงในมือถือ iPhone (Installation Guide)
- **วิธีที่ 1 (สะดวกและเร็วที่สุดผ่าน Expo Go)**:
  - รันคำสั่ง `yarn start` ใน Terminal
  - เปิดกล้อง หรือแอป **Expo Go** บน iPhone 15 Plus สแกน QR Code แล้วเปิดใช้งานได้ทันที
- **วิธีที่ 2 (ติดตั้งเป็น Native App ตรงผ่าน Xcode)**:
  - รันคำสั่ง `open ios/ExpenseTracker.xcworkspace`
  - ใน Xcode ให้ตรวจสอบ Signing & Capabilities เลือก Team `6333JAQ493`
  - เลือกเป้าหมายเป็นเครื่อง iPhone ของคุณ (`YyY`) แล้วกดปุ่ม **▶ (Run)** Xcode จะ Compile, Sign และ Install App ลงในเครื่องโดยตรง

---

---

## [2026-10-17] — Branch: `feat/react-native-mobile`

### ✨ สิ่งที่ทำเสร็จแล้ว (Completed Features)
1. **Dynamic Island & Live Activity Redesign**:
   - วิเคราะห์ปัญหาจาก UI ปัจจุบัน (การใช้ Emoji ละเมิด Zero-Emoji standard, ปุ่มแอคชันหนาเทอะทะ, และตัวเลขยอดเงินไม่เด่นชัด)
   - เชื่อมต่อสั่งการ Gemini Web ผ่านโมเดล **4 Argon** (โมเดลงานซับซ้อนและการออกแบบเชิงลึก) เพื่อสังเคราะห์โครงสร้าง SwiftUI ระดับ Apple Design Award
   - ออกแบบ UI ครบทั้ง 3 สถานะ:
     - **แบบย่อ (Compact Island)**: ไอคอนสลิปมินิมอลสีเขียวมรกตเรืองแสง + ยอดเงินตัวเลข Monospaced Rounded ชัดเจน
     - **แบบขยายเมื่อกดค้าง (Expanded Island)**: ยอดเงินเด่นชัด (Hero Amount), แท็กหมวดหมู่เวกเตอร์ SF Symbols, ชิปผู้รับเงิน Monogram อักษรย่อ (`[M]` Mom, `[A]` Apart) ปลอดอิโมจิ 100%, และปุ่มแคปซูลแก้ว (Glassmorphic Buttons) สบายตาและพอดีนิ้วโป้ง
     - **หน้าจอล็อค (Lock Screen Live Activity Banner)**: การ์ดกระจกมนโค้งมน (Frosted Glass) แยกสัดส่วนเวลาตรวจพบ ยอดเงิน และปุ่มยืนยันผ่าน AppIntents
2. **เอกสารสเปกและ Mockup Previews**:
   - สร้างเอกสารเปรียบเทียบสเปกและดีไซน์: `dynamic_island_options.md`
   - สร้าง Interactive HTML Simulators: `dynamic_island_preview.html`, `argon_single_preview.html`
   - เรนเดอร์รูปภาพตัวอย่างเสมือนจริง: `argon_design_mockup.png`, `dynamic_island_live_activity_mockup_1792232510248.jpg`, `dynamic_island_preview.png`

---

---

## [2026-10-22] — Branch: `feat/react-native-mobile`

### ✨ สิ่งที่ทำเสร็จแล้ว (Completed Features)
1. **Center FAB Bottom Navigation (`src/mobile/components/BottomNavBar.tsx`)**:
   - พัฒนาแถบเมนูด้านล่างสไตล์ 06 Center FAB ตามภาพอ้างอิงของผู้ใช้
   - โค้งเว้า Notch รองรับปุ่มกลางด้วย SVG Cubic Bezier Path คมชัด ละมุนตา ไม่ใช่เทมเพลตสำเร็จรูป
   - **ปุ่มตรงกลาง (Center FAB)**: ยกระดับเป็นวงกลมลอยสีมรกต (`#10b981`) ทำหน้าที่เป็น Anchor หลักของแอป ("ตรงกลาง default เลยนะ ห้ามเปลี่ยน เป็นหน้าที่ใช้ปัจจุบัน") แตะแล้วกลับมาหน้าหลักเสมอ
   - **เมนูขนาบข้าง (Second Priority)**:
     - ฝั่งซ้าย: `ปฏิทิน` (`CalendarDays` icon)
     - ฝั่งขวา: `โปรไฟล์` (`User` icon)
   - ปลอด Emoji 100% ตาม Zero-Emoji Standard และรองรับ Safe Area Insets สำหรับ iPhone 15 Plus
2. **Calendar Card View พร้อม Total ยอดเงินรายวัน และดูรายการธุรกรรมย่อย (`src/mobile/components/CalendarCardView.tsx`)**:
   - หน้าปฏิทินแสดงตารางเดือน โดยในการ์ดแต่ละวันแสดง **ยอดรวมเงินที่ใช้งาน (Total Daily Spend)** เช่น `-฿350`
   - **เจาะลึกดูรายการของแต่ละวัน (Day Transaction Inspector)**: เมื่อแตะการ์ดวันใดๆ จะแสดงรายการธุรกรรมทั้งหมดที่ทำไปในวันนั้นทันที พร้อมหมวดหมู่, โน้ต, เวลา, ยอดเงิน, และปุ่มแก้ไข/ลบ
   - ตรวจจับวันที่ใช้เงินเกินงบ (Daily Budget Warning) ไฮไลต์ด้วยสีอย่างชัดเจน
   - มีปุ่ม `[บันทึกเพิ่ม]` สำหรับกระโดดไปยังหน้าหลักเพื่อลงรายการของวันดังกล่าวได้ทันที
3. **รวมสแกนสลิป + บันทึกเป็นชุดไว้ในหน้าหลัก (`HomeScreen.tsx` & `QuickAddCard.tsx`)**:
   - นำปุ่ม **สแกนสลิป (Scan Slip)** และ **บันทึกหลายรายการ (Batch Add)** มารวมไว้ด้วยกันในฟอร์มของหน้าหลักเรียบร้อยแล้ว
   - รองรับการเลือกรูปสลิปจากอัลบั้มเพื่อถอดรหัส OCR แบบ On-Device ทันทีผ่าน `scanSlipUri`
4. **Backend API Extension (`src/app/api/transactions/route.ts`)**:
   - ขยาย endpoint ให้รองรับ query `?month=YYYY-MM` สำหรับดึงข้อมูลสรุปยอดรายวันทั้งเดือนแบบรวดเร็วและแม่นยำ
5. **Unit Tests & Type Safety**:
   - เพิ่มชุดทดสอบ `useMonthlyCalendar.test.ts`
   - ผลการทดสอบ `yarn test` ผ่านครบ 75/75 tests จาก 12 test suites
   - `yarn tsc --noEmit` ผ่านสมบูรณ์ 0 errors

---

### 📋 Handoff Block (สำหรับการส่งต่องานข้าม Session)
```markdown
[KEYWORD: expense-tracking-center-fab-bottom-nav-ready]
- สถานะปัจจุบัน: ติดตั้ง Center FAB Bottom Bar, Calendar Card View แสดง Total รายวัน, และรวมสแกนสลิป/บันทึกชุดไว้ในหน้าหลักเรียบร้อย ทดสอบผ่าน 75/75 tests
- ส่วนที่ปรับปรุง: `BottomNavBar.tsx`, `CalendarCardView.tsx`, `useMonthlyCalendar.ts`, `HomeScreen.tsx`, `QuickAddCard.tsx`, `slipScanner.ts`, `route.ts`
- คำสั่งทดสอบ: `yarn test` และ `yarn tsc --noEmit`
- Prompt สำหรับเริ่ม Session ถัดไป:
  "ทดสอบการใช้งาน BottomNavBar และ CalendarCardView บน iPhone 15 Plus"
```

