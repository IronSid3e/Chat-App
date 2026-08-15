import * as Crypto from "expo-crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { User } from "@/types";

export async function ensureDirectMessage(
  supabase: SupabaseClient<Database>,
  userId: string,
  user: User,
): Promise<string> {
  const { data: myMemberships } = await supabase
    .from("channel_members")
    .select("channel_id")
    .eq("user_id", userId);

  const myChannelIds = (myMemberships ?? []).map((m) => m.channel_id);

  if (myChannelIds.length > 0) {
    const { data: sharedMemberships } = await supabase
      .from("channel_members")
      .select("channel_id")
      .in("channel_id", myChannelIds)
      .eq("user_id", user.id);

    const sharedIds = (sharedMemberships ?? []).map((m) => m.channel_id);

    if (sharedIds.length > 0) {
      const { data: dm } = await supabase
        .from("channels")
        .select("id")
        .in("id", sharedIds)
        .eq("is_direct_message", true)
        .limit(1)
        .maybeSingle();

      if (dm?.id) return dm.id;
    }
  }

  const name =
    user.full_name || `${user.first_name} ${user.last_name}`.trim() || "Sohbet";

  const channelId = Crypto.randomUUID();

  const { error: chErr } = await supabase.from("channels").insert({
    id: channelId,
    name,
    is_direct_message: true,
    avatar_url: user.avatar_url,
  });
  if (chErr) throw chErr;

  const { error: mErr1 } = await supabase
    .from("channel_members")
    .insert({ channel_id: channelId, user_id: userId });
  if (mErr1) throw mErr1;

  const { error: mErr2 } = await supabase
    .from("channel_members")
    .insert({ channel_id: channelId, user_id: user.id });
  if (mErr2) throw mErr2;

  return channelId;
}
