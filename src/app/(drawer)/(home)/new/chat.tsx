import { View } from "react-native";
import React from "react";
import UserList from "@/components/UserList";

export default function chat() {
  return (
    <View className="flex-1">
      <UserList />
    </View>
  );
}
