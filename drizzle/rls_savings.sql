-- ==========================================================================
-- รันไฟล์นี้ใน Supabase SQL Editor ครั้งเดียว หลังจาก npm run db:push
-- (แยกจาก drizzle/rls.sql เพราะไฟล์นั้นรันไปแล้ว รันซ้ำจะ error เพราะ
--  constraint/policy เดิมมีอยู่แล้ว)
-- ==========================================================================

alter table public.savings_transactions
  add constraint savings_transactions_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.savings_transactions enable row level security;

create policy "own savings_transactions"
  on public.savings_transactions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
