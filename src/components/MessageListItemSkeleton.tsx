import { View } from "react-native";
import React from "react";
import { SkeletonBar } from "./Skeleton";

export default function MessageListItemSkeleton() {
  return (
    <View className="mb-2 w-full flex-row justify-end">
      <View className="max-w-[80%] rounded-2xl rounded-br-none bg-white/10 p-2">
        <SkeletonBar className="mb-2 h-4 w-48" />
        <SkeletonBar className="h-4 w-32" />
      </View>
    </View>
  );
}
