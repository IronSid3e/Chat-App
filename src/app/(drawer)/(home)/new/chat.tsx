import { View } from "react-native";
import React from "react";
import UserList from "@/components/UserList";
import { getHeaderBandHeight } from "@/utils/headerHeight";

export default function chat() {
  const headerHeight = getHeaderBandHeight();
  return (
    <View style={{ flex: 1, paddingTop: headerHeight }}>
      <UserList />
    </View>
  );
}
