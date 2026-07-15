# Implement Plan — เว็บบันทึกรายรับรายจ่ายรายวัน

> เป้าหมาย: แทนที่ Google Sheet ด้วยเว็บแอป responsive กรอกจากมือถือได้ทั้งวัน
> ข้อจำกัด: **ค่าใช้จ่าย 0 บาท** อยู่ได้ 1–2 ปี แล้วค่อยย้ายไป VPS ทีหลังโดยไม่ต้องเขียนใหม่
> ชีตเดิมเป็นแค่แบบร่างให้ดูเป็นไอเดีย ไม่มีข้อมูลเก่าต้อง import — เริ่มกรอกในเว็บใหม่ได้เลย

---

## 1. Stack ที่เลือก

| ชั้น | เลือกใช้ | เหตุผล |
|---|---|---|
| Frontend | **Next.js 16 (App Router) + TypeScript + Tailwind 4** | Mobile-first responsive, ไม่ต้องพึ่ง UI lib ให้อ้วน |
| Backend | **Next.js Route Handlers (`/app/api/*`)** | ไม่ต้องแยก repo/แยก deploy — คนเดียวทำคนเดียวดูแล |
| Database | **Supabase (Postgres) free tier** | ฟรี 500 MB + **ได้ Auth มาในตัว** ไม่ต้องตั้ง Auth.js เอง |
| ORM | **Drizzle ORM** (driver: `postgres-js`) | เบา, typed, migration ชัดเจน |
| Auth | **Supabase Auth** — Google + อีเมล/รหัสผ่าน | ครบในที่เดียวกับ DB, session เป็น cookie |
| แยกข้อมูล | **RLS (Row Level Security)** | Postgres บังคับเองว่าแถวไหนเป็นของใคร |
| Deploy | ยังไม่สรุป (Vercel free เป็นตัวเต็ง) | ค่อยว่ากันตอน M5 |

**ทำไมย้ายจาก Neon มา Supabase:** ตอนแรกเลือก Neon เพราะไม่ pause แต่พอต้องมี auth รองรับหลาย user
Supabase ชนะขาด — ได้ Auth (สมัคร/ล็อกอิน/Google OAuth/รีเซ็ตรหัส) + RLS มาฟรีในตัว
ถ้าใช้ Neon ต้องไปตั้ง Auth.js + Google Cloud Console + เขียน session เองทั้งหมด

**ข้อเสียที่รับได้:** Supabase free จะ pause โปรเจกต์ถ้าไม่มีใครแตะเลย 7 วัน (ข้อมูลไม่หาย
แค่เข้า dashboard กดปลุก) — แอปนี้กรอกทุกวันอยู่แล้ว โอกาสโดนน้อยมาก

**ข้อดีเรื่อง exit plan:** เป็น Postgres มาตรฐาน วันที่มีเงินเช่า VPS แค่ `pg_dump` → restore
ลง Postgres ตัวเอง โค้ด Drizzle ไม่ต้องแก้ (มีแต่ Auth ที่ต้องหาตัวแทน)

**ค่าใช้จ่ายจริง:** 0 บาท/เดือน ยกเว้นอยากได้ custom domain ~350฿/ปี

---

## 2. Data Model

```
auth.users                 -- Supabase สร้างให้เอง ไม่ต้องทำตารางเอง
  id (uuid), email, ...

months                     -- ยอดตั้งต้นของแต่ละเดือน
  id, user_id (uuid → auth.users)
  ym               -- 'YYYY-MM'
  opening_balance  -- ยอดยกมา/เงินเดือน ที่มีตอนต้นเดือน (เช่น 697.58)
  note, closed_at
  UNIQUE (user_id, ym)

transactions               -- ทั้งรายรับและรายจ่ายอยู่ตารางเดียว
  id, user_id (uuid → auth.users)
  date            (DATE)          -- วันของรายการ ใช้รวมยอดรายวัน
  spent_at        (TIMESTAMPTZ)   -- เวลาจริงที่กด ใช้เรียงลำดับ + โชว์ว่ากี่โมง
  type            ('income' | 'expense')
  amount          (NUMERIC(12,2))
  category        ('food'|'drink'|'transport'|'bill'|'shopping'|'fun'|'other')
  note            (TEXT)          -- "หมายเหตุ" เช่น ชาเขียว
  created_at
  INDEX (user_id, date)
```

> **ความปลอดภัยของข้อมูล 2 ชั้น** (`drizzle/rls.sql`)
> 1. ทุก API route ดึง `user_id` จาก session cookie ที่ Supabase ยืนยันแล้ว **ไม่เคยรับจาก client**
> 2. เปิด RLS ใน Postgres — policy `auth.uid() = user_id` ต่อให้แอปเขียนพลาดก็ยังกันได้อีกชั้น
>    (จำเป็นมาก เพราะ Supabase เปิด REST API ให้ทุกตารางอัตโนมัติด้วย anon key ที่ฝังอยู่ในหน้าเว็บ)

> **ไม่มีช่องเช้า/บ่าย/เย็น** — กรอกตอนไหนก็ได้ ระบบจับ `spent_at` ให้เอง
> พอจบวันค่อยรวมยอด: `เงินตั้งต้นของวัน − รายจ่ายรวมของวันนั้น = เหลือ`

> **เวลาอิง Asia/Bangkok เสมอ** ไม่ใช่เวลา server (Vercel รันบน UTC — ถ้าไม่ล็อกโซน
> รายการที่กรอกตอนเย็นจะเด้งไปอยู่ผิดวัน) ดู `TZ` ใน `src/lib/shared.ts`

> **ทำไมแยก `opening_balance` ออกจาก `transactions`:** ยอดยกมาต้นเดือนกับรายรับที่ได้ระหว่างเดือน
> เป็นคนละความหมาย ถ้าเก็บปนกันจะนับซ้ำตอนรวมยอด แยกไว้แบบนี้รองรับได้ทั้งสองแบบ —
> เงินที่มีติดตัวอยู่แล้วใส่ `opening_balance` ครั้งเดียวตอนขึ้นเดือนใหม่,
> เงินที่ได้เพิ่มระหว่างเดือน (เงินเดือนออก, โอนเข้า) บันทึกเป็น `transaction` type=income เรื่อยๆ

**สูตรสิ้นเดือน**
```
คงเหลือ = opening_balance + SUM(income ของเดือนนั้น) - SUM(expense ของเดือนนั้น)
```

---

## 3. Flow การใช้งาน (ตามที่ต้องการ)

### แถบเดือน (Month Carousel) — อยู่บนสุดทุกหน้า
```
        ‹  ◦ ◦ ● ◦ ◦  ›
   มิ.ย.   [ ก.ค. 2026 ]   ส.ค.
   ยอดยกมา 697.58 · ใช้ไป 45 · เหลือ 652.58
```
- เห็นตลอดเวลาว่า**กำลังกรอกเดือนไหนอยู่** — แก้ปัญหาหลงเดือนแบบตอนใช้ Excel
- **ปัดซ้าย/ขวาบนมือถือ** (หรือกดลูกศรบนจอใหญ่) เพื่อสลับเดือนไปมา
- เดือนปัจจุบันไฮไลต์ไว้ชัด, เดือนอนาคตเป็นสีจาง (กรอกไม่ได้)
- ใต้ชื่อเดือนมีสรุปย่อ 3 ตัวเลข อัปเดตสดทุกครั้งที่บันทึก
- เดือนที่ปิดยอดแล้วขึ้นป้าย ✓ ปิดยอดแล้ว

> Implement: `useSwipeable` หรือ CSS `scroll-snap-type: x mandatory` + URL เป็น `?m=2026-07` (แชร์ลิงก์/refresh แล้วอยู่เดือนเดิม)

### แท็บ "รายวัน" — หน้าหลัก (ใช้ 95% ของเวลา)
1. **ตอนเช้า — ใส่เงินตั้งต้นของวัน**
   - ถ้ายังไม่มีรายรับของวันนี้ → ขึ้นการ์ดเตือนให้กด `+ รายรับ` ใส่ก่อน
   - เป็นแค่การเตือน ไม่ล็อก — จะข้ามไปกรอกรายจ่ายเลยก็ได้
2. **ระหว่างวัน — กรอกเรื่อยๆ ไม่จำกัดจำนวน**
   - ฟอร์มกรอกด่วนอยู่บนสุด: พิมพ์ตัวเลข → เลือกหมวด → ใส่หมายเหตุ → Enter
   - บันทึกแล้วเคลียร์ช่องและโฟกัสกลับที่จำนวนเงินทันที กรอกอันถัดไปรัวๆ ได้
   - รายการเรียงตามเวลาจริง โชว์ว่ากดตอนกี่โมง แตะถังขยะเพื่อลบ
3. **จบวัน — แถบสรุปอัปเดตสดอยู่แล้ว**
   - `เงินตั้งต้น − ใช้ไป = เหลือ` ถ้าติดลบขึ้นเตือนสีแดงว่าใช้เกินไปเท่าไหร่

### แท็บ "สรุปเดือน" — มุมมองรายเดือน (แทน Excel เดิม)
- ตารางทั้งเดือนหน้าตาเหมือนชีตเดิม: `วันที่ | รายการ | รายรับ | รายจ่าย | หมายเหตุ | คงเหลือ`
- วันที่ยังไม่ได้กรอกขึ้นเป็นแถวจาง แตะแล้วเด้งฟอร์มกรอกได้เลย
- ปุ่ม **"ปิดยอดสิ้นเดือน"**: ยอดยกมา + รายรับรวม − รายจ่ายรวม = **คงเหลือ**
- กราฟรายจ่ายรายวัน + สัดส่วนตามหมวด + วันที่ใช้จ่ายหนักสุด
- ปุ่ม "ยกยอดไปเดือนหน้า" → เอา `คงเหลือ` ไปเป็น `opening_balance` ของเดือนถัดไปให้อัตโนมัติ

### หน้า `/history`
- ค้นหาจากหมายเหตุ, กรองตามหมวด, export CSV

---

## 4. Milestones

| # | งาน | สถานะ |
|---|---|---|
| **M0** | `create-next-app` + Tailwind + โครงโปรเจกต์ | ✅ เสร็จ |
| **M1** | Drizzle schema (`months`, `transactions`) + migration SQL | ✅ เสร็จ (`drizzle/0000_*.sql`) |
| **M2** | API: `GET/PUT /api/months/[ym]`, `POST /api/transactions`, `PATCH/DELETE /api/transactions/[id]` | ✅ เสร็จ |
| **M3** | UI: month carousel + แท็บรายวัน (quick add) + แท็บสรุปเดือน | ✅ เสร็จ (`npm run build` ผ่าน) |
| **M4** | Auth: Supabase Auth (Google + อีเมล), หน้า `/login`, `proxy.ts` กันหน้า, RLS | ✅ เสร็จ |
| **M5** | **สร้าง Supabase project → ใส่ env → `npm run db:push` → รัน `rls.sql`** | ⏳ **รออยู่ตรงนี้** |
| **M6** | Deploy (Vercel เป็นตัวเต็ง) — ยังไม่สรุปว่าลงที่ไหน | ⬜ |
| **M7** | ขัดผิว: PWA เพิ่มลงจอโฮม, export CSV, ยกยอดข้ามเดือน | ⬜ |

### ไฟล์สำคัญของ auth
- `src/proxy.ts` — Next 16 เปลี่ยนชื่อจาก `middleware` เป็น `proxy` แล้ว ทำหน้าที่ต่ออายุ session
  ทุก request + เตะคนที่ยังไม่ล็อกอินไป `/login`
- `src/lib/supabase/server.ts` — ใช้ `getUser()` ไม่ใช่ `getSession()` เพราะ `getSession()`
  แค่อ่าน cookie ดิบๆ ซึ่งปลอมได้ ห้ามเอามาตัดสินสิทธิ์
- `src/lib/api.ts` — `requireUserId()` ทุก route เรียกตัวนี้ก่อนแตะ DB

---

## 5. Free tier ระวังอะไรบ้าง

- **Neon free:** ~0.5 GB — บันทึกวันละ 10 รายการ 2 ปี ≈ 7,300 แถว ≈ ไม่ถึง 5 MB → **เหลือเฟือ**
- **Vercel Hobby:** ห้ามใช้เชิงพาณิชย์ (ส่วนตัวโอเค), bandwidth 100 GB/เดือน → ใช้คนเดียวไม่มีทางถึง
- **สำรองข้อมูล:** ตั้ง cron ยิง `GET /api/export` เดือนละครั้ง เก็บ CSV ลง Drive กันเหนียว

## 6. Checklist ต่อ Supabase (ขั้นที่เหลืออยู่ขั้นเดียว)

**ฝั่งคุณ (ทำใน browser):**
1. https://supabase.com → New project → region **Southeast Asia (Singapore)** → ตั้ง Database Password แล้ว**จดไว้**
2. เอา 3 ค่ามาใส่ `.env.development` (ไฟล์เตรียมช่องพร้อมคำอธิบายไว้ให้แล้ว):
   - `NEXT_PUBLIC_SUPABASE_URL` ← Project Settings → API → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ← Project Settings → API → anon public key
   - `DATABASE_URL` ← ปุ่ม Connect → แท็บ Transaction pooler (port 6543) + แทน `[YOUR-PASSWORD]`
3. หลัง Claude รัน `db:push` แล้ว: เปิด **SQL Editor** ใน Supabase → วางเนื้อหา `drizzle/rls.sql` → Run
   (ขาดขั้นนี้ = ข้อมูลทุกคนถูกอ่านผ่าน REST API ของ Supabase ได้ ห้ามข้าม)

**ฝั่ง Claude (หลังได้ key):**
4. `npm run db:push` — สร้างตาราง `months`, `transactions`
5. `npm run dev` — เปิดทดสอบที่ http://localhost:3000

**เปิด Google Login (ทำทีหลังได้ ใช้อีเมล/รหัสผ่านไปก่อน):**
- Google Cloud Console → สร้าง OAuth Client ID (Web) → เอา Client ID/Secret
  ไปใส่ Supabase → Authentication → Providers → Google (Supabase มี callback URL ให้คัดลอก)

## 7. สิ่งที่ยังไม่ได้ทำ (จดไว้กันลืม)
- แก้ไขรายการที่กรอกไปแล้ว (ตอนนี้ทำได้แค่ลบแล้วกรอกใหม่ — API `PATCH` มีแล้ว ขาดแค่ UI)
- Export CSV / สำรองข้อมูล
- Deploy (Vercel เป็นตัวเต็ง — คุยกันก่อนค่อยทำ)
