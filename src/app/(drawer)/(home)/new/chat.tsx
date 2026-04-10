import { View, Text } from "react-native";
import React from "react";
import UserList from "@/components/UserList";

export default function chat() {
  return (
    <View className="bg-white">
      <UserList />
    </View>
  );
}
