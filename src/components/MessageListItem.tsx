import { View, Text, Image, Animated } from "react-native";
import React, { useEffect, useRef } from "react";
import { Message } from "@/types";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type MessageListItemProps = {
  message: Message;
  isOwnMessage?: boolean;
  animateIn?: boolean;
};

export default function MessageListItem({
  message,
  isOwnMessage,
  animateIn,
}: MessageListItemProps) {
  const time = message.created_at
    ? format(new Date(message.created_at), "HH:mm")
    : "";

  const progress = useRef(new Animated.Value(animateIn ? 0 : 1)).current;

  useEffect(() => {
    if (!animateIn) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [animateIn, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  return (
    <View
      className={`w-full flex-row mb-2 ${
        isOwnMessage ? "justify-end" : "justify-start"
      }`}
    >
      <Animated.View
        className={`max-w-[80%] ${isOwnMessage ? "items-end" : "items-start"}`}
        style={{ opacity: progress, transform: [{ translateY }] }}
      >
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
      </Animated.View>
    </View>
  );
}
