import { Image, Text, View, Pressable } from "react-native";
import React from "react";
import { Channel } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Link } from "expo-router";

type ChannelListItemProps = {
  channel: Channel;
};

export default function ChannelListItem({ channel }: ChannelListItemProps) {
  return (
    <Link href={`/channel/${channel.id}`} asChild>
      <Pressable className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <Image
          source={{ uri: channel.avatar_url ?? undefined }}
          className="w-14 h-14 rounded-full mr-4 bg-gray-200"
        />

        <View className="flex-1 justify-center">
          <View className="flex-row justify-between items-center mb-1">
            <Text
              className="font-semibold text-base text-gray-900 flex-1 mr-2"
              numberOfLines={1}
            >
              {channel.name}
            </Text>

            {channel.last_message && (
              <Text className="text-xs text-gray-500">
                {formatDistanceToNow(
                  new Date(channel.last_message.created_at),
                  { addSuffix: true },
                )}
              </Text>
            )}
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-600 flex-1" numberOfLines={2}>
              {channel.last_message
                ? channel.last_message.content ??
                  (channel.last_message.image_url ? "Fotoğraf" : "Henüz mesaj yok")
                : "Henüz mesaj yok"}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
