import { View, Animated } from "react-native";
import { Image } from "expo-image";
import Text from "./AppText";
import React, { memo, useEffect, useRef } from "react";
import { Message } from "@/types";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  OTHER_BUBBLE_COLORS,
  OWN_BUBBLE_COLORS,
  useSettings,
} from "@/providers/SettingsProvider";

type MessageListItemProps = {
  message: Message;
  isOwnMessage?: boolean;
  animateIn?: boolean;
};

function transformedUri(uri: string): string {
  if (!uri.includes("/object/public/")) return uri;
  const sep = uri.includes("?") ? "&" : "?";
  return `${uri}${sep}width=480&quality=70`;
}

function MessageListItem({
  message,
  isOwnMessage,
  animateIn,
}: MessageListItemProps) {
  const { settings } = useSettings();

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
              ? "rounded-br-none"
              : "border border-gray-200 rounded-bl-none"
          }`}
          style={{
            backgroundColor: isOwnMessage
              ? OWN_BUBBLE_COLORS[settings.ownBubbleColor]
              : OTHER_BUBBLE_COLORS[settings.otherBubbleColor],
          }}
        >
          {message.image_url && (
            <Image
              source={{ uri: transformedUri(message.image_url) }}
              style={{ width: 256, height: 256, borderRadius: 12 }}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
            />
          )}
          {message.content && (
            <View className={`px-2 py-1 ${message.image_url ? "mt-1" : ""}`}>
              <Text
                className={`text-base leading-7 ${
                  isOwnMessage ? "text-white" : "text-gray-900"
                }`}
              >
                {message.content}
              </Text>
            </View>
          )}
        </View>
        <Text
          className={`text-[10px] leading-4 text-gray-400 mt-1 ${
            isOwnMessage ? "" : "pl-1"
          }`}
        >
          {time}
        </Text>
      </Animated.View>
    </View>
  );
}

export default memo(MessageListItem);
