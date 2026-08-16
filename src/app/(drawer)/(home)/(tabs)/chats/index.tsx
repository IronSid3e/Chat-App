import {
  View,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from "react-native";
import Text from "@/components/AppText";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect } from "expo-router";
import ChannelListItem from "@/components/ChannelListItem";
import { useSupabase } from "@/providers/SupabaseProvider";
import { withAuthRetry } from "@/utils/withRetry";
import { Channel, Message } from "@/types";

type LastMessage = Pick<Message, "id" | "content" | "image_url" | "created_at">;

type LastMessageRow = LastMessage & { channel_id: string };

export default function ChannelListScreen() {
  const supabase = useSupabase();
  const { userId } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChannels = useCallback(async () => {
    if (!userId) return;
    try {
      const { data: memberships, error: err1 } = await withAuthRetry(() =>
        supabase
          .from("channel_members")
          .select("channels(*)")
          .eq("user_id", userId),
      );

      if (err1) throw err1;

      const chans: Channel[] = (memberships ?? [])
        .map((m) => m.channels)
        .filter((c): c is Channel => !!c)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));

      let lastByChannel = new Map<string, LastMessage>();
      if (chans.length > 0) {
        const { data: msgs, error: err2 } = await withAuthRetry(() =>
          supabase.rpc("get_last_messages", {
            p_channel_ids: chans.map((c) => c.id),
          }),
        );

        if (err2) throw err2;

        for (const m of msgs ?? []) {
          lastByChannel.set(m.channel_id, {
            id: m.id,
            content: m.content,
            image_url: m.image_url,
            created_at: m.created_at,
          });
        }
      }

      setChannels(
        chans.map((c) => ({
          ...c,
          last_message: lastByChannel.get(c.id) ?? null,
        })),
      );
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Kanallar yüklenemedi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase, userId]);

  useFocusEffect(
    useCallback(() => {
      loadChannels();
    }, [loadChannels]),
  );

  useEffect(() => {
    const channel = supabase
      .channel("channel-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as LastMessageRow;
          setChannels((prev) =>
            prev.map((c) =>
              c.id === msg.channel_id
                ? {
                    ...c,
                    last_message: {
                      id: msg.id,
                      content: msg.content,
                      image_url: msg.image_url,
                      created_at: msg.created_at,
                    },
                  }
                : c,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (loading) {
    return (
      <View className="flex-1 pt-24 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 pt-24 bg-white justify-center items-center px-6">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <Pressable
          onPress={() => {
            setLoading(true);
            loadChannels();
          }}
        >
          <Text className="text-blue-500 font-semibold">Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 pt-24 bg-white">
      {channels.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-gray-500 text-lg">Henüz sohbetin yok</Text>
          <Text className="text-gray-400 mt-2 text-center">
            Yeni sohbet başlatmak için menüdeki kullanıcılardan birini seç
          </Text>
        </View>
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={channels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChannelListItem channel={item} />}
          contentContainerClassName="pb-6"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadChannels();
              }}
              tintColor="#ef4444"
            />
          }
        />
      )}
    </View>
  );
}
