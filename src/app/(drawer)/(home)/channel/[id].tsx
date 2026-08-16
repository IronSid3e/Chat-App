import { View } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import Text from "@/components/AppText";
import { Stack, useLocalSearchParams } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import MessageList from "@/components/MessageList";
import MessageInput, { PendingImage } from "@/components/MessageInput";
import { useSupabase } from "@/providers/SupabaseProvider";
import { getHeaderBandHeight } from "@/utils/headerHeight";
import {
  ensureNotificationPermissions,
  setActiveChannel,
} from "@/utils/notifications";
import { Channel, Message } from "@/types";
import { withAuthRetry } from "@/utils/withRetry";

export default function ChannelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const supabase = useSupabase();
  const { userId } = useAuth();
  const headerHeight = getHeaderBandHeight();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setActiveChannel(id);
    ensureNotificationPermissions();
    return () => setActiveChannel(null);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("channels")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setChannelError(error.message);
        } else {
          setChannel(data);
        }
      });
  }, [id, supabase]);

  const loadMessages = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await withAuthRetry(() =>
        supabase
          .from("messages")
          .select(
            "id, channel_id, sender_id, content, image_url, created_at, sender:profiles(id, full_name, avatar_url)",
          )
          .eq("channel_id", id)
          .order("created_at", { ascending: false })
          .limit(100),
      );

      if (error) throw error;
      setMessages(data ?? []);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Mesajlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [supabase, id]);

  useEffect(() => {
    setLoading(true);
    loadMessages();

    if (!id) return;
    const channelSub = supabase
      .channel(`messages:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [newMessage, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [supabase, id, loadMessages]);

  const sendMessage = useCallback(
    async (text: string, image?: PendingImage) => {
      if (!userId || !id) return;

      const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimistic: Message = {
        id: tempId,
        channel_id: id,
        sender_id: userId,
        content: text || null,
        image_url: image?.uri ?? null,
        created_at: new Date().toISOString(),
        sender: null,
      };
      setMessages((prev) => [optimistic, ...prev]);

      try {
        let imageUrl: string | null = null;
        if (image) {
          const mimeType = image.mimeType ?? "image/jpeg";
          const ext = mimeType.split("/")[1] || "jpg";
          const path = `${userId}/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${ext}`;
          const arrayBuffer = await fetch(image.uri).then((r) =>
            r.arrayBuffer(),
          );
          const { error: uploadError } = await supabase.storage
            .from("message-images")
            .upload(path, arrayBuffer, { contentType: mimeType });

          if (uploadError) throw uploadError;

          imageUrl = supabase.storage
            .from("message-images")
            .getPublicUrl(path).data.publicUrl;
        }

        const { data, error } = await supabase
          .from("messages")
          .insert({
            channel_id: id,
            sender_id: userId,
            content: text || null,
            image_url: imageUrl,
          })
          .select("id, channel_id, sender_id, content, image_url, created_at")
          .single();

        if (error) throw error;

        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempId);
          const withoutReal = withoutTemp.filter((m) => m.id !== data.id);
          return [{ ...data }, ...withoutReal];
        });
      } catch (e: any) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        throw e;
      }
    },
    [supabase, userId, id],
  );

  if (channelError) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-red-500 text-center">{channelError}</Text>
      </View>
    );
  }

  if (!channel) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-400">Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: headerHeight }}>
      <Stack.Screen options={{ title: channel.name }} />
      <MessageList
        messages={messages}
        loading={loading}
        error={error}
        myUserId={userId}
        onRetry={() => {
          setLoading(true);
          loadMessages();
        }}
      />
      <MessageInput onSend={sendMessage} />
    </View>
  );
}
