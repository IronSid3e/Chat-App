import { FlatList, Text, View } from "react-native";
import React from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import channels from "@/data/channels";
import messages from "@/data/messages";
import MessageList from "@/components/MessageList";

export default function ChannelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const channel = channels.find((c) => c.id === id);

  if (!channel) {
    return (
      <View>
        <Text>Channel not found</Text>
      </View>
    );
  }
  return (
    <View className="flex-1 justify-center items-center">
      <Stack.Screen options={{ title: channel.name }} />
      <MessageList />
    </View>
  );
}
