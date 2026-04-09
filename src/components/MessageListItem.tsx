import { View, Text, Image } from "react-native";
import React from "react";
import { Message } from "@/types";

type MessageListItemProps = {
  message: Message;
  isOwnMessage?: boolean;
};

export default function MessageListItem({
  message,
  isOwnMessage,
}: MessageListItemProps) {
  return (
    <View
      className={`w-full flex-row mb-4 ${
        isOwnMessage ? "justify-end" : "justify-start"
      }`}
    >
      <View
        className={`max-w-[80%] rounded-2xl p-2 shadow-sm ${
          isOwnMessage
            ? "bg-blue-500 rounded-br-none"
            : "bg-gray-100 border border-gray-200 rounded-bl-none"
        }`}
      >
        {message.image && (
          <Image
            source={{ uri: message.image }}
            className="w-64 h-64 rounded-xl"
            resizeMode="cover"
          />
        )}
        {message.content && (
          <View className={`px-2 py-1 ${message.image ? "mt-1" : ""}`}>
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
    </View>
  );
}
