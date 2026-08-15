import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import MessageListItem from "./MessageListItem";
import { useSupabase } from "@/providers/SupabaseProvider";
import { Message } from "@/types";

type MessageListProps = {
  channelId: string;
};

export default function MessageList({ channelId }: MessageListProps) {
  const supabase = useSupabase();
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          "id, channel_id, sender_id, content, image_url, created_at, sender:profiles(id, full_name, avatar_url)",
        )
        .eq("channel_id", channelId)
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
  }, [supabase, channelId]);

  useEffect(() => {
    setLoading(true);
    loadMessages();

    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
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
      supabase.removeChannel(channel);
    };
  }, [supabase, channelId, loadMessages]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-red-500 text-center mb-3">{error}</Text>
        <Pressable
          onPress={() => {
            setLoading(true);
            loadMessages();
          }}
        >
          <Text className="text-blue-500 font-semibold">Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }

  if (messages.length === 0) {
    return (
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-gray-400 text-center">
          Henüz mesaj yok. İlk mesajı sen yaz!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id}
      contentContainerClassName="p-3"
      renderItem={({ item }) => (
        <MessageListItem
          message={item}
          isOwnMessage={item.sender_id === userId}
        />
      )}
      inverted
      showsVerticalScrollIndicator={false}
    />
  );
}
