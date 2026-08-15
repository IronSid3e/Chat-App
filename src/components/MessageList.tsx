import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import React from "react";
import MessageListItem from "./MessageListItem";
import { Message } from "@/types";

type MessageListProps = {
  messages: Message[];
  loading: boolean;
  error: string | null;
  myUserId?: string | null;
  onRetry: () => void;
};

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

  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id}
      contentContainerClassName="p-3"
      renderItem={({ item }) => (
        <MessageListItem message={item} isOwnMessage={item.sender_id === myUserId} />
      )}
      inverted
      showsVerticalScrollIndicator={false}
    />
  );
}
