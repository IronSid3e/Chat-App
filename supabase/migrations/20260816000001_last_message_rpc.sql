-- ============================================================
-- ChatApp — get_last_messages RPC
-- Kanal başına yalnızca son mesajı döner (distinct on).
-- Kullanıcının üyesi olduğu kanalların son mesaj özetini hızlıca
-- almak için; tüm mesajları çekip client'ta ayıklamaya gerek kalmaz.
-- ============================================================

create or replace function public.get_last_messages(p_channel_ids uuid[])
returns table (
  channel_id uuid,
  id uuid,
  content text,
  image_url text,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct on (m.channel_id)
    m.channel_id,
    m.id,
    m.content,
    m.image_url,
    m.created_at
  from public.messages m
  where m.channel_id = any (p_channel_ids)
    and exists (
      select 1
      from public.channel_members cm
      where cm.channel_id = m.channel_id
        and cm.user_id = (auth.jwt() ->> 'sub')
    )
  order by m.channel_id, m.created_at desc, m.id;
$$;

grant execute on function public.get_last_messages(uuid[]) to authenticated;
