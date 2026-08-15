-- ============================================================
-- ChatApp — Initial schema
-- Clerk, Supabase'e 3. taraf JWT issuer olarak bağlıdır.
-- auth.jwt() ->> 'sub' => Clerk kullanıcı id'si (profiles.id ile eşleşir).
-- Not: auth.uid() KULLANILMAZ çünkü Clerk id'leri ("user_...") uuid değildir
-- ve auth.uid() sub'ı uuid'ye cast ederek hata verir.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- TABLES
-- ------------------------------------------------------------

-- 1. profiles — Clerk kullanıcılarını yansıtır (id = Clerk user id)
create table public.profiles (
  id text primary key,
  first_name text not null default '',
  last_name text not null default '',
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. channels — sohbet kanalları (1:1 veya grup)
create table public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_direct_message boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- 3. channel_members — kullanıcıların kanal üyelikleri
create table public.channel_members (
  channel_id uuid not null references public.channels (id) on delete cascade,
  user_id text not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);

-- 4. messages — kanal mesajları (metin veya resim, en az biri zorunlu)
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  sender_id text not null references public.profiles (id) on delete cascade,
  content text,
  image_url text,
  created_at timestamptz not null default now(),
  check (content is not null or image_url is not null)
);

-- ------------------------------------------------------------
-- updated_at trigger
-- ------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------
create index channel_members_user_id_idx on public.channel_members (user_id);
create index channel_members_channel_id_idx on public.channel_members (channel_id);
create index messages_channel_id_created_at_idx on public.messages (channel_id, created_at desc);
create index messages_sender_id_idx on public.messages (sender_id);
create index profiles_full_name_idx on public.profiles (full_name);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
-- Üyelik kontrolü yardımcı fonksiyonu.
-- security definer: policy içinde aynı tabloya alt sorgu → sonsuz özyineleme
-- olmaması için RLS'yi bypass eder.
create or replace function public.is_channel_member(target_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.channel_members cm
    where cm.channel_id = target_channel_id
      and cm.user_id = (auth.jwt() ->> 'sub')
  );
$$;

alter table public.profiles enable row level security;
alter table public.channels enable row level security;
alter table public.channel_members enable row level security;
alter table public.messages enable row level security;

-- profiles
create policy "profiles are publicly readable"
  on public.profiles for select to authenticated using (true);

create policy "users can insert their own profile"
  on public.profiles for insert to authenticated with check ((auth.jwt() ->> 'sub') = id);

create policy "users can update their own profile"
  on public.profiles for update to authenticated
  using ((auth.jwt() ->> 'sub') = id) with check ((auth.jwt() ->> 'sub') = id);

-- channels
create policy "members can read their channels"
  on public.channels for select to authenticated
  using (public.is_channel_member(id));

create policy "authenticated users can create channels"
  on public.channels for insert to authenticated with check (true);

create policy "members can update their channels"
  on public.channels for update to authenticated
  using (public.is_channel_member(id));

-- channel_members
create policy "members can view channel membership"
  on public.channel_members for select to authenticated
  using (public.is_channel_member(channel_id));

create policy "users can join channels and members can add users"
  on public.channel_members for insert to authenticated
  with check ((auth.jwt() ->> 'sub') = user_id or public.is_channel_member(channel_id));

-- messages
create policy "members can read channel messages"
  on public.messages for select to authenticated
  using (public.is_channel_member(channel_id));

create policy "members can send messages"
  on public.messages for insert to authenticated
  with check (sender_id = (auth.jwt() ->> 'sub') and public.is_channel_member(channel_id));

-- ------------------------------------------------------------
-- REALTIME
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.channels;
alter publication supabase_realtime add table public.channel_members;
