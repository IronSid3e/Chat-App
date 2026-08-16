import { ActivityIndicator, Image, Pressable, View } from "react-native";
import React, { memo } from "react";
import Text from "./AppText";
import { User } from "@/types";

type UserListItemProps = {
  user: User;
  onPress?: () => void;
  starting?: boolean;
};

function UserListItem({
  user,
  onPress,
  starting,
}: UserListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center p-4 gap-4 border-b border-gray-100"
    >
      <View className="bg-gray-200 w-12 h-12 items-center justify-center rounded-full">
        {user.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <Text className="font-bold text-2xl leading-8 color-gray-600">
            {(user.first_name || "?").charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View className="flex-1">
        <Text className="font-medium text-lg leading-7">
          {user.first_name} {user.last_name}
        </Text>
        {user.full_name !== `${user.first_name} ${user.last_name}`.trim() &&
          user.full_name && (
            <Text className="text-sm leading-5 text-gray-500">{user.full_name}</Text>
          )}
      </View>
      {starting && <ActivityIndicator size="small" color="#ef4444" />}
    </Pressable>
  );
}

export default memo(UserListItem);
