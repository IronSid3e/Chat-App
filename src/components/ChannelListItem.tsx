import { Image, Text, View } from "react-native";
import React from "react";
import { Channel } from "@/types";
import { formatDistanceToNow } from "date-fns";

type ChannelListItemProps = {
  channel: Channel;
};

export default function ChannelListItem({ channel }: ChannelListItemProps) {
  return (
    <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
      <Image
        source={{ uri: channel.avatar }}
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

          {channel.lastMessage && (
            <Text className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(channel.lastMessage.createdAt), {
                addSuffix: true,
              })}
            </Text>
          )}
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-gray-600 flex-1" numberOfLines={2}>
            {channel.lastMessage?.content || "Henüz mesaj yok"}
          </Text>
        </View>
      </View>
    </View>
  );
}
