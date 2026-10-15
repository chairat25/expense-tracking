# Expense Tracking — Daily Expense Tracker (PWA)

เว็บแอปพลิเคชันบันทึกรายรับรายจ่ายรายวัน ออกแบบเพื่อการใช้งานบนมือถือเป็นหลัก (Mobile-First Responsive PWA) มาพร้อมระบบอ่านสลิปธนาคารอัจฉริยะ (OCR), ถาดพักคิวตรวจสลิปหลายใบพร้อมกัน, ฟอร์มกรอกรายการแบบชุด, และระบบทำงานอัตโนมัติร่วมกับ iOS Shortcuts

---

## 1. จุดเด่นและฟีเจอร์หลัก (Key Features)

### 1.1 บันทึกด่วนรายวัน (Single Quick Add & Date Capsule)
* **Date Capsule Bar**: สลับดูรายการ ย้อนหลัง / วันนี้ / เมื่อวาน ได้อย่างรวดเร็ว พร้อมปุ่มลัดย้อนกลับสู่วันปัจจุบัน
* **Status Card**: แสดงผลรวมรายจ่ายและรายรับประจำวันแบบเรียลไทม์ พร้อมการเปรียบเทียบงบประมาณรายวัน (Daily Budget)
* **Auto-Focus & Smart Presets**: บันทึกแล้วเคลียร์ช่องพร้อมโฟกัสกลับช่องจำนวนเงินทันที กรอกรายการต่อไปได้ต่อเนื่อง

### 1.2 ถาดตรวจสลิปแบบกลุ่ม (Multi-Receipt Staging Queue)
* **เลือกสลิปหลายรูปพร้อมกัน**: รองรับการเลือกภาพสลิปจากอัลบั้มหลายใบในครั้งเดียว (`ReceiptBatchModal`)
* **Sequential OCR Processing**: รันอ่านข้อความจากสลิปทีละ 1 ใบอย่างเป็นระเบียบ เพื่อป้องกันปัญหา Memory Spike หรือเครื่องค้างบนมือถือ
* **Card-by-Card Review**: แต่ละสลิปจะแปลงเป็นการ์ด Draft ที่แสดงรูปพรีวิว (แตะเพื่อขยายภาพขนาดเต็มได้), ยอดเงิน, วันที่, หมวดหมู่ และหมายเหตุ
* **Accept / Reject / Accept All**: ผู้ใช้สามารถตรวจทานและเลือก **Accept (บันทึก)** หรือ **Reject (ทิ้ง)** ได้ทีละใบ หรือกด **Accept All** เพื่อบันทึกทั้งหมดที่ตรวจเสร็จแล้วในคลิกเดียว

### 1.3 กรอกหลายรายการพร้อมกัน (Batch Manual Add)
* **ไม่ต้องมีสลิปก็กรอกชุดได้**: หน้าต่าง `BatchAddModal` สำหรับวันที่จำได้ว่ามีค่าใช้จ่ายย่อยๆ หลายอย่าง
* **Dynamic Form Rows**: เพิ่ม/ลบแถวรายการได้อย่างอิสระ สลับประเภทรายจ่าย/รายรับ และเลือกหมวดหมู่ได้รายแถว
* **Live Aggregated Total**: คำนวณยอดรวมรายจ่ายและรายรับสดล่วงหน้าก่อนกดยืนยันบันทึก

### 1.4 ระบบเชื่อมต่ออัตโนมัติกับ iOS Shortcuts (Automation)
* **Trigger เมื่อปิดแอปธนาคาร**: ตั้งค่าใน iPhone ให้เมื่อปิดแอปธนาคาร (K PLUS, SCB, เป๋าตัง ฯลฯ) ให้ดึงสลิปล่าสุดส่งมาเปิด PWA ทันที
* **URL Parameter Deep Linking**:
  * `?auto=1` หรือ `?paste=1`: สั่งให้อ่านรูปสลิปจากคลิปบอร์ดแล้วเปิดคิว Staging อัตโนมัติ
  * `?text=...` หรือ `?slip=...`: รองรับข้อความสลิปที่ถอดผ่าน Apple Vision OCR บน iPhone กรอกฟอร์มสำเร็จใน 0.05 วินาที

### 1.5 ระบบจดจำรูปแบบร้านค้า (Pattern Learning Engine)
* จดจำว่าชื่อร้านค้าหรือผู้รับเงินนี้ (เช่น "7-Eleven", "Café Amazon", "ผลไม้") ผู้ใช้เคยบันทึกลงหมวดหมู่ใดและใส่หมายเหตุอะไร
* เมื่อสแกนเจอร้านเดิมในอนาคต ระบบจะดึงหมวดหมู่และโน้ตเดิมมากรอกให้อัตโนมัติ

---

## 2. เทคโนโลยีที่ใช้ (Tech Stack)

| ชั้นของระบบ | เทคโนโลยีที่เลือกใช้ | รายละเอียด |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router + Turbopack)** | React 19, TypeScript, Mobile-First UI |
| **Styling & Icons** | **Tailwind CSS v4 + Lucide Icons** | โทนสีมืด Slate-950 / Emerald-500, **Zero-Emoji Standard** (ใช้ Vector Icons 100%) |
| **Database & Auth** | **Supabase (PostgreSQL + Supabase Auth)** | จัดการฐานข้อมูลผ่าน **Drizzle ORM**, มี RLS (Row Level Security) 2 ชั้น |
| **Client-Side OCR** | **Tesseract.js + Canvas Preprocessing** | ถอดข้อความภาษาไทยและตัวเลขในสลิปผ่าน Web Worker ในเครื่องผู้ใช้ |
| **Testing** | **Vitest** | Unit Tests สำหรับ Receipt Parser, Preprocessing และ Pattern Learning |
| **Package Manager** | **Yarn (v1)** | บังคับใช้ `yarn` สำหรับทุกคำสั่งในโปรเจกต์ |

---

## 3. โครงสร้างฐานข้อมูล (Database Schema)

* **`transactions`**:
  * `id`: Serial Primary Key
  * `user_id`: UUID (เชื่อมโยงกับ `auth.users` ของ Supabase)
  * `date`: VARCHAR(10) รูปแบบ `YYYY-MM-DD`
  * `spent_at`: TIMESTAMPTZ เวลาจริงที่ทำรายการ
  * `type`: `'expense'` หรือ `'income'`
  * `amount`: NUMERIC(12, 2)
  * `category`: หมวดหมู่ เช่น `'food'`, `'drink'`, `'transport'`, `'bill'`, `'shopping'`, `'fun'`, `'other'`
  * `note`: TEXT หมายเหตุหรือชื่อร้านค้า
* **`daily_budgets`**:
  * บันทึกงบประมาณรายวันแยกตามผู้ใช้และวันที่

---

## 4. โครงสร้างโฟลเดอร์สำคัญ (Directory Structure)

```
expense-tracking/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── transactions/      # Route จัดการ CRUD รายการธุรกรรม
│   │   │   ├── categories/        # Route ดึงหมวดหมู่ค่าใช้จ่าย
│   │   │   └── profile/           # Route จัดการโปรไฟล์และงบประมาณ
│   │   ├── login/                 # หน้า Authentication
│   │   ├── layout.tsx             # Root Layout (PWA Meta & Manifest)
│   │   └── page.tsx               # หน้าแรก (HomeView)
│   ├── components/
│   │   ├── HomeView.tsx           # หน้าจอหลักควบคุม State ทั้งหมด
│   │   ├── ReceiptBatchModal.tsx  # หน้าต่างจัดการคิวสลิปหลายใบ (Staging Queue)
│   │   ├── BatchAddModal.tsx      # หน้าต่างกรอกหลายรายการพร้อมกัน (Manual Batch)
│   │   └── MobileDatePicker.tsx   # ปฏิทินเลือกวันแบบ Mobile Capsule
│   ├── lib/
│   │   ├── receipt/
│   │   │   ├── parser.ts          # ตัวแกะยอดเงิน, วันที่ พ.ศ./ค.ศ., และชื่อร้านค้า
│   │   │   ├── ocr.ts             # ตัวเชื่อมต่อ Tesseract Web Worker
│   │   │   ├── preprocess.ts      # ปรับภาพ ขาว-ดำ-เทา เพิ่มความคมชัดก่อน OCR
│   │   │   └── patterns.ts        # ระบบจดจำประวัติร้านค้าและหมวดหมู่
│   │   ├── supabase/              # Client และ Server Supabase Helpers
│   │   └── shared.ts              # คำนวณงบประมาณ, จัดรูปแบบเงินบาท, วันที่ไทย
│   └── db/
│       ├── schema.ts              # Drizzle ORM Schema
│       └── index.ts               # Connection Pooler
```

---

## 5. การติดตั้งและรันโปรเจกต์ (Getting Started)

> **ข้อกำหนดสำคัญ**: โปรเจกต์นี้ใช้ **`yarn`** เท่านั้น (ห้ามใช้ `npm`, `pnpm`, หรือ `bun`)

### ติดตั้ง Dependencies
```bash
yarn install
```

### การตั้งค่า Environment Variables
สร้างไฟล์ `.env.development` จาก `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgres://postgres.your-project:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?prepare=false
```

### รันเซิร์ฟเวอร์สำหรับ Development
```bash
yarn dev
```
เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

### การทดสอบระบบ (Running Tests)
```bash
# รัน Unit Tests ทั้งหมด
yarn test

# รันเฉพาะส่วนทดสอบการอ่านสลิป
yarn test src/lib/receipt/
```

### การตรวจสอบ Production Build
```bash
yarn build
```

---

## 6. แนวทางการพัฒนาต่อไป (Future Roadmap)

1. **Universal Receipt Engine (Gemini 1.5 Flash Vision)**:
   * เชื่อมต่อ API AI Vision เพื่อให้อ่านสลิปเป๋าตัง (G-Wallet), ใบเสร็จกระดาษ 7-Eleven, และบิลร้านอาหารทั่วโลกได้ถูกต้อง 99.9%
2. **React Native Mobile App (Branch: `feat/react-native-mobile`)**:
   * พัฒนาแอป Native ผ่าน Expo เพื่อรองรับ **Zero-Click Ingestion** (เปิดแอปแล้วสแกนสลิปล่าสุดในเครื่องให้อัตโนมัติใน 0.05 วินาที โดยไม่ต้องกดปุ่มเลือกรูป)
   * รองรับ iOS Share Extension เพื่อกดแชร์รูปจาก Photos เข้าแอปได้ทันที
