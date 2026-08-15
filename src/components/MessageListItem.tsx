import { View, Text, Image } from "react-native";
import React from "react";
import { Message } from "@/types";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type MessageListItemProps = {
  message: Message;
  isOwnMessage?: boolean;
};

export default function MessageListItem({
  message,
  isOwnMessage,
}: MessageListItemProps) {
  const time = message.created_at
    ? format(new Date(message.created_at), "HH:mm")
    : "";

  return (
    <View
      className={`w-full flex-row mb-2 ${
        isOwnMessage ? "justify-end" : "justify-start"
      }`}
    >
      <View className={`max-w-[80%] ${isOwnMessage ? "items-end" : "items-start"}`}>
        <View
          className={`rounded-2xl p-2 shadow-sm ${
            isOwnMessage
              ? "bg-blue-500 rounded-br-none"
              : "bg-gray-100 border border-gray-200 rounded-bl-none"
          }`}
        >
          {message.image_url && (
            <Image
              source={{ uri: message.image_url }}
              className="w-64 h-64 rounded-xl"
              resizeMode="cover"
            />
          )}
          {message.content && (
            <View className={`px-2 py-1 ${message.image_url ? "mt-1" : ""}`}>
              <Text
                className={`text-base ${
                  isOwnMessage ? "text-white" : "text-gray-900"
                }`}
              >
                {message.content}
              </Text>
            </View>
          )}
        </View>
        <Text
          className={`text-[10px] text-gray-400 mt-1 ${
            isOwnMessage ? "" : "pl-1"
          }`}
        >
          {time}
        </Text>
      </View>
    </View>
  );
}
