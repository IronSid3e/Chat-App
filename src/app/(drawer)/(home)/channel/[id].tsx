import { InteractionManager, View } from "react-native";
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
import { compressImageForUpload } from "@/utils/image";
import * as Sentry from "@sentry/react-native";

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
  const [oldestLoadedAt, setOldestLoadedAt] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!id) return;
    setActiveChannel(id);
    ensureNotificationPermissions();
    return () => setActiveChannel(null);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const handle = InteractionManager.runAfterInteractions(() => {
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
    });
    return () => handle.cancel();
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
          .limit(30),
      );

      if (error) throw error;
      const msgs = data ?? [];
      setMessages(msgs);
      setOldestLoadedAt(
        msgs.length > 0 ? msgs[msgs.length - 1].created_at : null,
      );
      setHasMore(msgs.length === 30);
      setError(null);
    } catch (e: any) {
      Sentry.captureException(e);
      setError(e?.message ?? "Mesajlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [supabase, id]);

  const loadOlderMessages = useCallback(async () => {
    if (!id || !oldestLoadedAt || !hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const { data, error } = await withAuthRetry(() =>
        supabase
          .from("messages")
          .select(
            "id, channel_id, sender_id, content, image_url, created_at, sender:profiles(id, full_name, avatar_url)",
          )
          .eq("channel_id", id)
          .lt("created_at", oldestLoadedAt)
          .order("created_at", { ascending: false })
          .limit(30),
      );

      if (error) throw error;
      const older = data ?? [];
      setMessages((prev) => [...prev, ...older]);
      if (older.length > 0) {
        setOldestLoadedAt(older[older.length - 1].created_at);
      }
      setHasMore(older.length === 30);
    } catch (e: any) {
      Sentry.captureException(e);
      console.error("Eski mesajlar yüklenemedi:", e?.message);
    } finally {
      setLoadingMore(false);
    }
  }, [supabase, id, oldestLoadedAt, hasMore, loadingMore]);

  useEffect(() => {
    setLoading(true);
    const handle = InteractionManager.runAfterInteractions(() => {
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
    });

    return () => handle.cancel();
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
          const compressed = await compressImageForUpload(
            image.uri,
            image.mimeType,
          );
          const mimeType = compressed.mimeType;
          const ext = mimeType.split("/")[1] || "jpg";
          const path = `${userId}/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${ext}`;
          const arrayBuffer = await fetch(compressed.uri).then((r) =>
            r.arrayBuffer(),
          );
          const { error: uploadError } = await supabase.storage
            .from("message-images")
            .upload(path, arrayBuffer, { contentType: mimeType });

          if (uploadError) throw uploadError;

          imageUrl = supabase.storage.from("message-images").getPublicUrl(path)
            .data.publicUrl;
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
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-center text-red-500">{channelError}</Text>
      </View>
    );
  }

  if (!channel) {
    return (
      <View className="flex-1 items-center justify-center">
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
        onLoadMore={loadOlderMessages}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onRetry={() => {
          setLoading(true);
          loadMessages();
        }}
      />
      <MessageInput onSend={sendMessage} />
    </View>
  );
}
