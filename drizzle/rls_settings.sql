-- ==========================================================================
-- รันไฟล์นี้ครั้งเดียว หลัง apply migration ที่สร้าง user_settings
-- (แยกไฟล์เพราะ rls.sql / rls_savings.sql รันไปแล้ว รันซ้ำจะ error)
-- ==========================================================================

alter table public.user_settings
  add constraint user_settings_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.user_settings enable row level security;

create policy "own user_settings"
  on public.user_settings for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
