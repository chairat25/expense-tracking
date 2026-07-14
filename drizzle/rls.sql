-- ==========================================================================
-- รันไฟล์นี้ใน Supabase SQL Editor "หลังจาก" npm run db:push เสร็จแล้ว
--
-- ทำไมต้องมี: Supabase เปิด REST API ให้ทุกตารางอัตโนมัติ (https://<project>.supabase.co/rest/v1/…)
-- ใช้ anon key ซึ่งฝังอยู่ในหน้าเว็บและใครก็อ่านได้ ถ้าไม่เปิด RLS = ใครก็ดึงข้อมูลทุกคนออกไปได้
-- เปิด RLS แล้ว Postgres จะบังคับเองว่าแต่ละแถวเป็นของใคร ต่อให้แอปเขียนพลาดก็ยังกันได้อีกชั้น
-- ==========================================================================

-- ลบข้อมูลตามเจ้าของ ถ้าวันหนึ่งลบ user ทิ้ง
alter table public.months
  add constraint months_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.transactions
  add constraint transactions_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.months        enable row level security;
alter table public.transactions  enable row level security;

-- แต่ละคนเห็น/แก้ได้เฉพาะแถวที่ user_id ตรงกับตัวเองเท่านั้น
create policy "own months"
  on public.months for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own transactions"
  on public.transactions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ไม่มี policy สำหรับ role `anon` = คนที่ยังไม่ล็อกอินอ่านอะไรไม่ได้เลย
