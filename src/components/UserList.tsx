import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import UserListItem from "./UserListItem";
import { useSupabase } from "@/providers/SupabaseProvider";
import { User } from "@/types";

export default function UserList() {
  const supabase = useSupabase();
  const { userId } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingUserId, setStartingUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", userId)
        .order("full_name");

      if (error) throw error;
      setUsers(data ?? []);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Kullanıcılar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const startChat = useCallback(
    async (user: User) => {
      if (!userId || startingUserId) return;
      setStartingUserId(user.id);
      try {
        const { data: myMemberships } = await supabase
          .from("channel_members")
          .select("channel_id")
          .eq("user_id", userId);

        const myChannelIds = (myMemberships ?? []).map((m) => m.channel_id);
        let channelId: string | null = null;

        if (myChannelIds.length > 0) {
          const { data: sharedMemberships } = await supabase
            .from("channel_members")
            .select("channel_id")
            .in("channel_id", myChannelIds)
            .eq("user_id", user.id);

          const sharedIds = (sharedMemberships ?? []).map(
            (m) => m.channel_id,
          );

          if (sharedIds.length > 0) {
            const { data: dm } = await supabase
              .from("channels")
              .select("id")
              .in("id", sharedIds)
              .eq("is_direct_message", true)
              .limit(1)
              .maybeSingle();
            channelId = dm?.id ?? null;
          }
        }

        if (!channelId) {
          const name =
            user.full_name ||
            `${user.first_name} ${user.last_name}`.trim() ||
            "Sohbet";

          channelId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
            /[xy]/g,
            (c) => {
              const r = (Math.random() * 16) | 0;
              const v = c === "x" ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            },
          );

          const { error: chErr } = await supabase
            .from("channels")
            .insert({
              id: channelId,
              name,
              is_direct_message: true,
              avatar_url: user.avatar_url,
            });
          if (chErr) throw chErr;

          const { error: mErr1 } = await supabase
            .from("channel_members")
            .insert({ channel_id: channelId, user_id: userId });
          if (mErr1) throw mErr1;

          const { error: mErr2 } = await supabase
            .from("channel_members")
            .insert({ channel_id: channelId, user_id: user.id });
          if (mErr2) throw mErr2;
        }

        router.push(`/channel/${channelId}`);
      } catch (e: any) {
        console.error("DM başlatılamadı:", e?.message);
        Alert.alert("Sohbet başlatılamadı", e?.message ?? "Bir hata oluştu.");
      } finally {
        setStartingUserId(null);
      }
    },
    [supabase, userId, startingUserId, router],
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-red-500 text-center mb-3">{error}</Text>
        <Pressable
          onPress={() => {
            setLoading(true);
            loadUsers();
          }}
        >
          <Text className="text-blue-500 font-semibold">Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }

  if (users.length === 0) {
    return (
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-gray-400 text-center">
          Başka kullanıcı bulunamadı.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <UserListItem
          user={item}
          onPress={() => startChat(item)}
          starting={startingUserId === item.id}
        />
      )}
    />
  );
}
