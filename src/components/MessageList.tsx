import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import React, { useMemo } from "react";
import MessageListItem from "./MessageListItem";
import { Message } from "@/types";
import { format, isToday, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";

type MessageListProps = {
  messages: Message[];
  loading: boolean;
  error: string | null;
  myUserId?: string | null;
  onRetry: () => void;
};

type Row =
  | { type: "message"; message: Message }
  | { type: "date"; day: string };

function dayLabel(date: string): string {
  const d = new Date(date);
  if (isToday(d)) return "Bugün";
  if (isYesterday(d)) return "Dün";
  return format(d, "d MMMM yyyy", { locale: tr });
}

export default function MessageList({
  messages,
  loading,
  error,
  myUserId,
  onRetry,
}: MessageListProps) {
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
        <Pressable onPress={onRetry}>
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

  const rows = useMemo<Row[]>(() => {
    const result: Row[] = [];
    let prevDay: string | null = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const day = dayLabel(messages[i].created_at);
      if (day !== prevDay) {
        result.push({ type: "date", day });
        prevDay = day;
      }
      result.push({ type: "message", message: messages[i] });
    }
    return result.reverse();
  }, [messages]);

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) =>
        item.type === "date" ? `d-${item.day}` : item.message.id
      }
      contentContainerClassName="p-3"
      renderItem={({ item }) =>
        item.type === "date" ? (
          <View className="items-center my-3">
            <Text className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              {item.day}
            </Text>
          </View>
        ) : (
          <MessageListItem
            message={item.message}
            isOwnMessage={item.message.sender_id === myUserId}
          />
        )
      }
      inverted
      showsVerticalScrollIndicator={false}
    />
  );
}
