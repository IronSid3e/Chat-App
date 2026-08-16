import {
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import Text from "./AppText";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import UserListItem from "./UserListItem";
import { useSupabase } from "@/providers/SupabaseProvider";
import { ensureDirectMessage } from "@/utils/dm";
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
        const channelId = await ensureDirectMessage(supabase, userId, user);
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
