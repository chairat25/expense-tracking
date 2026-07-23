-- ==========================================================================
-- รันไฟล์นี้หลัง apply migration 0004_add_salaries.sql
-- ==========================================================================

alter table public.salaries
  add constraint salaries_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.salaries enable row level security;

create policy "own salaries"
  on public.salaries for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
