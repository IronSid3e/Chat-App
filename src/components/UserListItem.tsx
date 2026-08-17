import { ActivityIndicator, Pressable, View } from "react-native";
import { Image } from "expo-image";
import React, { memo } from "react";
import Text from "./AppText";
import { User } from "@/types";

type UserListItemProps = {
  user: User;
  onPress?: () => void;
  starting?: boolean;
};

function UserListItem({ user, onPress, starting }: UserListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 border-b border-white/10 p-4"
      accessibilityRole="button"
      accessibilityLabel={`${user.first_name} ${user.last_name} ile sohbet başlat`}
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-white/20">
        {user.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            className="h-12 w-12 rounded-full"
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
            placeholder="rgba(255,255,255,0.15)"
          />
        ) : (
          <Text className="text-2xl font-bold leading-8 text-white">
            {(user.first_name || "?").charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View className="flex-1">
        <Text className="text-lg font-medium leading-7 text-white">
          {user.first_name} {user.last_name}
        </Text>
        {user.full_name !== `${user.first_name} ${user.last_name}`.trim() &&
          user.full_name && (
            <Text className="text-sm leading-5 text-white/60">
              {user.full_name}
            </Text>
          )}
      </View>
      {starting && <ActivityIndicator size="small" color="#EA7B7B" />}
    </Pressable>
  );
}

export default memo(UserListItem);
