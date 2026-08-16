-- ============================================================
-- ChatApp — pg_trgm GIN indexes for search
-- Search ekranında kullanılan ILIKE '%term%' sorguları büyük
-- tablolarda sekans scan yapar; trigram index bunları index scan'e çevirir.
-- ============================================================

create extension if not exists pg_trgm;

create index messages_content_trgm_idx
  on public.messages using gin (content gin_trgm_ops);

create index profiles_full_name_trgm_idx
  on public.profiles using gin (full_name gin_trgm_ops);

create index profiles_first_name_trgm_idx
  on public.profiles using gin (first_name gin_trgm_ops);

create index profiles_last_name_trgm_idx
  on public.profiles using gin (last_name gin_trgm_ops);
