# Spec: Expense Tracker React Native Mobile (Expo) & Zero-Click Bank Receipt Ingestion

## 1. ภาพรวมและเป้าหมาย (Overview & Goal)
เป้าหมายของ Branch `feat/react-native-mobile` คือการแปลงระบบ **Expense Tracking** จากเดิมที่เป็น Next.js Web App ให้กลายเป็น **Native Mobile Application เต็มรูปแบบด้วย React Native (Expo)** เพื่อให้ผู้ใช้สามารถ:
1. ใช้งานแอปบนสมาร์ทโฟนได้รวดเร็วและลื่นไหลระดับ Native
2. มีระบบ **Zero-Click Ingestion** ที่สามารถ **ตรวจจับและอ่านสลิปธนาคารล่าสุดให้อัตโนมัติทันทีที่เปิดแอป** หลังทำธุรกรรมในแอปธนาคาร โดยผู้ใช้ไม่ต้องกดเลือกรูปเอง
3. คงฟังก์ชันหลักที่มีอยู่บน `main` ไว้อย่างครบถ้วน: Date Capsule, Daily Budget Status Card, Quick Add, History Timeline, และการเชื่อมต่อ Supabase Backend เดิม
4. ยึดมั่นตามมาตรฐาน **Zero-Emoji Standard** โดยใช้ Vector Icons จาก `lucide-react-native` เท่านั้น

---

## 2. ฟังก์ชันเด่น: Zero-Click Bank Receipt Ingestion (ตรวจจับสลิปอัตโนมัติเมื่อเปิดแอป)

### 2.1 ปัญหาเดิม (The Problem)
ในระบบเว็บเดิม ผู้ใช้ต้องกดเข้าแอป -> กดเปิดถาดตรวจสลิป -> กดเลือกรูปภาพจากอัลบั้ม -> เลือกสลิป -> กดยืนยัน ทำให้มีหลายขั้นตอนและไม่สะดวกในชีวิตประจำวัน

### 2.2 โซลูชันบน React Native (The Solution)
เมื่อผู้ใช้โอนเงินผ่านแอปธนาคาร (เช่น K PLUS, SCB Easy, Krungthai NEXT, เป๋าตัง ฯลฯ) แอปธนาคารจะบันทึกรูป e-Slip ลงในอัลบั้มรูปภาพของมือถือ (`Photos` / `Camera Roll`) ทันที

เมื่อผู้ใช้สลับกลับมาเปิด Expense Tracker:
1. **AppState Listener**: ดักจับจังหวะที่แอปเปลี่ยนสถานะเป็น `active` (Foreground)
2. **Media Sniffer (`expo-media-library`)**:
   - ตรวจสอบสิทธิ์การเข้าถึงรูปภาพ
   - ดึงรูปภาพล่าสุด 1 รูปล่าสุดจากอัลบั้ม (`MediaLibrary.getAssetsAsync({ first: 1, sortBy: ['creationTime'] })`)
   - ตรวจสอบว่า:
     - รูปนี้ถูกสร้างขึ้นมาภายใน **15 นาทีล่าสุด** หรือไม่
     - ID ของรูปนี้ (`asset.id`) เคยผ่านการประมวลผลไปแล้วหรือยัง (เช็กกับ `last_processed_receipt_id` ใน `AsyncStorage`)
3. **Instant Auto-Parsing & Staging**:
   - หากพบว่าเป็นสลิปใหม่ ระบบจะนำภาพเข้าสู่ Receipt OCR & Parser ทันที
   - เด้งหน้าต่าง **"ตรวจพบสลิปธนาคารล่าสุด" (Auto-Receipt Staging Modal)** ขึ้นมาหน้าจอทันที พร้อมกรอก:
     - จำนวนเงิน (Amount)
     - วันที่ทำรายการ (Date)
     - หมวดหมู่ที่แนะนำ (Category - จาก Pattern Learning Engine)
     - หมายเหตุ/ชื่อผู้รับโอน (Note)
   - ผู้ใช้เพียงแค่แตะปุ่ม **"บันทึก" (Accept)** เพียงคลิกเดียว หรือแตะ **"ยกเลิก" (Reject)** หากไม่ใช่สลิปที่ต้องการบันทึก

---

## 3. สถาปัตยกรรมระบบ (Architecture & Tech Stack)

| ส่วนประกอบ | เทคโนโลยี | รายละเอียด |
| :--- | :--- | :--- |
| **Framework** | **Expo SDK 52 + React Native** | React 19 / TypeScript, รันได้ทั้ง iOS & Android |
| **Icons & Design** | **`lucide-react-native`** | **Zero-Emoji Standard 100%** (ใช้ Vector Icons ทางการทั้งหมด) |
| **Database & Auth** | **Supabase (`@supabase/supabase-js`)** | เชื่อมต่อ Database และ Auth เดิมของโปรเจกต์ |
| **Session Storage** | **`expo-secure-store` / `AsyncStorage`** | เก็บ Auth Session Token และประวัติสลิปที่อ่านไปแล้ว |
| **Media & Sniffer** | **`expo-media-library`** | ดึงภาพสลิปล่าสุดในเครื่องแบบ Background/Foreground sniffer |
| **Timezone** | **`Asia/Bangkok`** | ล็อกเขตเวลาประเทศไทยในการจัดกลุ่มวันที่และสรุปผล |

---

## 4. โครงสร้างหน้าจอและ Components (UI / UX Layout)

### 4.1 `HomeScreen` (หน้าจอหลัก)
* **Header Bar**: แสดงโปรไฟล์ผู้ใช้ ยอดคงเหลือ และปุ่มเปิดหน้าต่างการตั้งค่า
* **Date Capsule Bar**: ปุ่มเลือกระหว่าง `เมื่อวาน` · `วันนี้` · `เลือกวันที่ (DatePicker)`
* **Daily Status Card**:
  * ใช้ไปแล้ว (Daily Spent)
  * ได้รับ (Daily Income)
  * เปรียบเทียบกับงบประมาณรายวัน (Daily Budget Comparison)
* **Quick Add Card**:
  * ช่องกรอกจำนวนเงิน (Auto-focus & Number Pad)
  * ปุ่มสลับ `รายจ่าย` / `รายรับ`
  * ปุ่มเลือกหมวดหมู่แบบไอคอน Lucide (อาหาร, เครื่องดื่ม, เดินทาง, บิล, ของใช้, บันเทิง, อื่นๆ)
  * ช่องระบุหมายเหตุพร้อมระบบ Quick Note Suggestion
  * ปุ่มกดบันทึกธุรกรรม
* **Transaction History Timeline**:
  * รายการธุรกรรมประจำวัน เรียงตามเวลา (`spentAt`)
  * ปุ่มลบรายการ (Delete Action พร้อมยืนยัน)

### 4.2 `AutoReceiptModal` (หน้าต่างตรวจสลิปอัตโนมัติ)
* พรีวิวภาพสลิปที่ดึงมาจากอัลบั้ม
* ฟอร์มตรวจทานยอดเงิน หมวดหมู่ และหมายเหตุ
* ปุ่ม **"บันทึกรายการ"** และ **"ข้าม/ปิด"**

---

## 5. การจำแนกหมวดหมู่แบบ Vector Icons (Zero-Emoji Mapping)

| หมวดหมู่ | Slug | Lucide Icon Component |
| :--- | :--- | :--- |
| อาหาร | `food` | `<Utensils size={20} />` |
| เครื่องดื่ม | `drink` | `<Coffee size={20} />` |
| เดินทาง | `transport` | `<Car size={20} />` |
| บิล/ค่างวด | `bill` | `<Receipt size={20} />` |
| ช้อปปิ้ง/ของใช้ | `shopping` | `<ShoppingBag size={20} />` |
| บันเทิง | `fun` | `<Film size={20} />` |
| อื่นๆ | `other` | `<Package size={20} />` |

---

## 6. แผนการเปลี่ยนผ่าน (Transition Strategy)
ใน branch `feat/react-native-mobile` นี้ เราจะ:
1. เก็บสคริปต์ [gemini_web_coder.js](file:///Users/pond/Documents/Goal/expense/expense-tracking/scripts/gemini_web_coder.js) ไว้เพื่อใช้ส่งงานให้ Gemini Web ช่วยเขียนโค้ด React Native
2. Scaffold โครงโปรเจกต์ Expo React Native ขึ้นมาที่ Root โดยใช้ `yarn`
3. เชื่อมต่อเข้ากับ Supabase Client เพื่อใช้ตาราง `transactions`, `months`, `daily_budgets` เดิม
4. พัฒนา `useRecentReceiptSniffer` Hook สำหรับการทำ Zero-Click Ingestion
