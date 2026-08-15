import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { useSupabase } from "@/providers/SupabaseProvider";
import {
  ensureNotificationPermissions,
  getActiveChannel,
  notifyNewMessage,
} from "@/utils/notifications";

export default function NotificationListener() {
  const supabase = useSupabase();
  const { userId } = useAuth();

  useEffect(() => {
    if (!userId) return;
    ensureNotificationPermissions();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as {
            id: string;
            channel_id: string;
            sender_id: string;
            content: string | null;
            image_url: string | null;
          };
          if (msg.sender_id === userId) return;
          if (getActiveChannel() === msg.channel_id) return;

          const { data: ch } = await supabase
            .from("channels")
            .select("name")
            .eq("id", msg.channel_id)
            .maybeSingle();

          const body = msg.image_url ? "Fotoğraf" : msg.content ?? "Yeni mesaj";
          notifyNewMessage(ch?.name ?? "Yeni mesaj", body);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  return null;
}
