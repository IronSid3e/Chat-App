import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import React, { memo } from "react";
import Text from "./AppText";
import { Channel } from "@/types";
import { formatMessageTime } from "@/utils/formatMessageTime";
import { Link } from "expo-router";

type ChannelListItemProps = {
  channel: Channel;
};

function ChannelListItem({ channel }: ChannelListItemProps) {
  return (
    <Link href={`/channel/${channel.id}`} asChild>
      <Pressable
        className="flex-row items-center border-b border-white/10 px-4 py-3"
        accessibilityRole="button"
        accessibilityLabel={`${channel.name} kanalını aç`}
      >
        <Image
          source={channel.avatar_url ? { uri: channel.avatar_url } : undefined}
          className="mr-4 h-14 w-14 rounded-full bg-white/20"
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          placeholder="rgba(255,255,255,0.15)"
        />

        <View className="flex-1 justify-center">
          <View className="mb-1 flex-row items-center justify-between">
            <Text
              className="mr-2 flex-1 text-base font-semibold leading-7 text-white"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {channel.name}
            </Text>

            {channel.last_message && (
              <Text className="text-xs leading-4 text-white/60">
                {formatMessageTime(channel.last_message.created_at)}
              </Text>
            )}
          </View>

          <View className="flex-row items-center justify-between">
            <Text
              className="flex-1 text-sm leading-5 text-white/70"
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {channel.last_message
                ? (channel.last_message.content ??
                  (channel.last_message.image_url
                    ? "Fotoğraf"
                    : "Henüz mesaj yok"))
                : "Henüz mesaj yok"}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export default memo(ChannelListItem);
