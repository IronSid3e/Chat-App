import { View } from "react-native";
import React from "react";
import { SkeletonBar } from "./Skeleton";

export default function ChannelListItemSkeleton() {
  return (
    <View className="flex-row items-center border-b border-white/10 px-4 py-3">
      <SkeletonBar className="mr-4 h-14 w-14 rounded-full" />
      <View className="flex-1 justify-center gap-2">
        <SkeletonBar className="h-4 w-1/2" />
        <SkeletonBar className="h-3 w-3/4" />
      </View>
    </View>
  );
}
