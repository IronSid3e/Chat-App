-- ============================================================
-- ChatApp — Faz 3: message image storage
-- Public bucket + RLS. Path format: {user_id}/{timestamp}.{ext}
-- ============================================================

insert into storage.buckets (id, name, public)
values ('message-images', 'message-images', true)
on conflict (id) do nothing;

-- Herkes (giriş yapmış) okuyabilir; sadece sahibi kendi klasörüne yükleyebilir
create policy "authenticated users can upload images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'message-images'
    and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );

create policy "authenticated users can read images"
  on storage.objects for select to authenticated
  using (bucket_id = 'message-images');

create policy "users can delete their own images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'message-images'
    and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );
