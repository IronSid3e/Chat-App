import { ActivityIndicator, Pressable, View } from "react-native";
import React, { memo } from "react";
import Text from "./AppText";
import Avatar from "./Avatar";
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
      <Avatar
        uri={user.avatar_url}
        name={`${user.first_name} ${user.last_name}`}
        size={48}
      />
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
