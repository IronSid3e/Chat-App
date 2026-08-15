import { Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";
import { useSupabase } from "@/providers/SupabaseProvider";
import { Channel } from "@/types";

export default function ChannelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const supabase = useSupabase();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("channels")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
        } else {
          setChannel(data);
        }
      });
  }, [id, supabase]);

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-red-500 text-center">{error}</Text>
      </View>
    );
  }

  if (!channel) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-400">Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ title: channel.name }} />
      <MessageList channelId={channel.id} />
      <MessageInput />
    </View>
  );
}
