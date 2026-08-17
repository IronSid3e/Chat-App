import { ActivityIndicator, Pressable, SectionList, View } from "react-native";
import { Image } from "expo-image";
import React from "react";
import Text from "@/components/AppText";
import Ionicons from "@expo/vector-icons/Ionicons";
import { formatMessageTime } from "@/utils/formatMessageTime";
import { User } from "@/types";

export type MessageResult = {
  id: string;
  channel_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  channel_name: string;
};

export type Row =
  { type: "user"; user: User } | { type: "message"; message: MessageResult };

export type SearchSection = { title: string; data: Row[] };

type SearchResultsListProps = {
  sections: SearchSection[];
  searching: boolean;
  startingUserId: string | null;
  onUserPress: (user: User) => void;
  onMessagePress: (channelId: string) => void;
};

export default function SearchResultsList({
  sections,
  searching,
  startingUserId,
  onUserPress,
  onMessagePress,
}: SearchResultsListProps) {
  const renderRow = ({ item }: { item: Row }) => {
    if (item.type === "user") {
      return (
        <Pressable
          onPress={() => onUserPress(item.user)}
          className="flex-row items-center border-b border-white/10 p-4"
        >
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white/20">
            {item.user.avatar_url ? (
              <Image
                source={{ uri: item.user.avatar_url }}
                className="h-12 w-12 rounded-full"
                contentFit="cover"
                transition={150}
                cachePolicy="memory-disk"
                placeholder="rgba(255,255,255,0.15)"
              />
            ) : (
              <Text className="text-2xl font-bold text-white">
                {(item.user.first_name || "?").charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text className="ml-3 flex-1 text-lg font-medium text-white">
            {item.user.first_name} {item.user.last_name}
          </Text>
          {startingUserId === item.user.id && (
            <ActivityIndicator size="small" color="#EA7B7B" />
          )}
        </Pressable>
      );
    }
    return (
      <Pressable
        onPress={() => onMessagePress(item.message.channel_id)}
        className="flex-row items-center border-b border-white/10 p-4"
      >
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/20">
          <Ionicons name="chatbubble-outline" size={22} color="white" />
        </View>
        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-sm font-medium text-white">
              {item.message.channel_name}
            </Text>
            {item.message.created_at && (
              <Text className="text-xs text-white/60">
                {formatMessageTime(item.message.created_at)}
              </Text>
            )}
          </View>
          <Text
            className="mt-0.5 text-sm text-white/70"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.message.content}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SectionList
      keyboardShouldPersistTaps="handled"
      sections={sections}
      keyExtractor={(row, index) =>
        row.type === "user" ? `u-${row.user.id}` : `m-${row.message.id}`
      }
      renderSectionHeader={({ section }) => (
        <Text className="px-4 pb-1 pt-3 text-xs font-semibold uppercase text-white/60">
          {section.title}
        </Text>
      )}
      renderItem={renderRow}
      ListEmptyComponent={
        !searching ? (
          <View className="flex-1 items-center justify-center px-6 pt-16">
            <Text className="text-center text-white/60">Sonuç bulunamadı</Text>
          </View>
        ) : null
      }
      contentContainerClassName="pb-28"
    />
  );
}
