-- ============================================================
-- ChatApp — Faz 4: status (story) sistemi
-- statuses tablosu + RLS + status-images storage bucket
-- ============================================================

create table if not exists public.statuses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles (id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists statuses_user_id_created_at_idx
  on public.statuses (user_id, created_at desc);

alter table public.statuses enable row level security;

create policy "authenticated users can insert their own status"
  on public.statuses for insert to authenticated
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "authenticated users can read all statuses"
  on public.statuses for select to authenticated
  using (true);

create policy "users can delete their own status"
  on public.statuses for delete to authenticated
  using ((auth.jwt() ->> 'sub') = user_id);

insert into storage.buckets (id, name, public)
values ('status-images', 'status-images', true)
on conflict (id) do nothing;

create policy "authenticated users can upload status images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'status-images'
    and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );

create policy "authenticated users can read status images"
  on storage.objects for select to authenticated
  using (bucket_id = 'status-images');

create policy "users can delete their own status images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'status-images'
    and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );
