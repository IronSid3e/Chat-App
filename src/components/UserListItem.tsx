import { Image, StyleSheet, Text, View } from "react-native";
import React from "react";
import { User } from "@/types";

type UserListItemProps = {
  user: User;
};
export default function UserListItem({ user }: UserListItemProps) {
  return (
    <View className="flex-row items-center p-4 gap-4 border-b border-gray-100 ">
      <View className="bg-gray-200 w-12 h-12 items-center justify-center rounded-full">
        {user.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <View className="rounded-full">
            <Text className="font-bold text-2xl color-gray-600">
              {user.first_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text className="font-medium text-lg">
        {user.first_name} {user.last_name}
      </Text>
    </View>
  );
}
