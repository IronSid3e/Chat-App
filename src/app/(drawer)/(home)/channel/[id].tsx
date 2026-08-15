import { Alert, Text, View } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";
import { useSupabase } from "@/providers/SupabaseProvider";
import { Channel, Message } from "@/types";

export default function ChannelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const supabase = useSupabase();
  const { userId } = useAuth();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const { data, error } = await supabase
        .from("messages")
        .select(
          "id, channel_id, sender_id, content, image_url, created_at, sender:profiles(id, full_name, avatar_url)",
        )
        .eq("channel_id", id)
        .order("created_at", { ascending: false })
        .limit(100);

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
    async (text: string) => {
      if (!userId || !id) return;

      const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimistic: Message = {
        id: tempId,
        channel_id: id,
        sender_id: userId,
        content: text,
        image_url: null,
        created_at: new Date().toISOString(),
        sender: null,
      };
      setMessages((prev) => [optimistic, ...prev]);

      const { data, error } = await supabase
        .from("messages")
        .insert({
          channel_id: id,
          sender_id: userId,
          content: text,
        })
        .select("id, channel_id, sender_id, content, image_url, created_at")
        .single();

      if (error) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        throw error;
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...data } : m)),
      );
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
    <View className="flex-1 bg-white">
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
