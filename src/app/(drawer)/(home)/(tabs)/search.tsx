import {
  View,
  TextInput,
  ActivityIndicator,
  Pressable,
  SectionList,
  Image,
  Alert,
} from "react-native";
import Text from "@/components/AppText";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSupabase } from "@/providers/SupabaseProvider";
import { ensureDirectMessage } from "@/utils/dm";
import { User } from "@/types";
import { formatDistanceToNow } from "date-fns";

type MessageResult = {
  id: string;
  channel_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  channel_name: string;
};
type Row =
  | { type: "user"; user: User }
  | { type: "message"; message: MessageResult };

export default function SearchScreen() {
  const supabase = useSupabase();
  const { userId } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<MessageResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [startingUserId, setStartingUserId] = useState<string | null>(null);

  const runSearch = useCallback(
    async (q: string) => {
      const term = q.trim().replace(/%/g, "");
      if (!term || !userId) {
        setUsers([]);
        setMessages([]);
        return;
      }
      setSearching(true);
      try {
        const [profilesRes, messagesRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .neq("id", userId)
            .or(
              `full_name.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`,
            )
            .order("full_name")
            .limit(10),
          supabase
            .from("messages")
            .select("id, channel_id, content, image_url, created_at, channels(name)")
            .ilike("content", `%${term}%`)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

        if (profilesRes.error) throw profilesRes.error;
        if (messagesRes.error) throw messagesRes.error;

        setUsers(profilesRes.data ?? []);
        setMessages(
          (messagesRes.data ?? []).map((m) => ({
            ...m,
            channel_name: m.channels?.name ?? "Sohbet",
          })),
        );
      } catch (e: any) {
        console.error("Arama hatası:", e?.message);
      } finally {
        setSearching(false);
      }
    },
    [supabase, userId],
  );

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const startChat = useCallback(
    async (user: User) => {
      if (!userId || startingUserId) return;
      setStartingUserId(user.id);
      try {
        const channelId = await ensureDirectMessage(supabase, userId, user);
        router.push(`/channel/${channelId}`);
      } catch (e: any) {
        Alert.alert("Sohbet başlatılamadı", e?.message ?? "Bir hata oluştu.");
      } finally {
        setStartingUserId(null);
      }
    },
    [supabase, userId, startingUserId, router],
  );

  const sections = useMemo(() => {
    const s: { title: string; data: Row[] }[] = [];
    if (users.length > 0) {
      s.push({
        title: "Kullanıcılar",
        data: users.map((u) => ({ type: "user", user: u })),
      });
    }
    if (messages.length > 0) {
      s.push({
        title: "Mesajlar",
        data: messages.map((m) => ({ type: "message", message: m })),
      });
    }
    return s;
  }, [users, messages]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-11">
          <Ionicons name="search" size={20} color="gray" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Kullanıcı veya mesaj ara"
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searching && (
            <ActivityIndicator size="small" color="#ef4444" />
          )}
        </View>
      </View>

      {query.trim() === "" ? (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="search-outline" size={48} color="#d1d5db" />
          <Text className="text-gray-400 text-center mt-3">
            Kullanıcı adı veya sohbet mesajı arayabilirsin
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(row, index) =>
            row.type === "user" ? `u-${row.user.id}` : `m-${row.message.id}`
          }
          renderSectionHeader={({ section }) => (
            <Text className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 bg-white uppercase">
              {section.title}
            </Text>
          )}
          renderItem={({ item }) =>
            item.type === "user" ? (
              <Pressable
                onPress={() => startChat(item.user)}
                className="flex-row items-center p-4 border-b border-gray-100"
              >
                <View className="bg-gray-200 w-12 h-12 items-center justify-center rounded-full">
                  {item.user.avatar_url ? (
                    <Image
                      source={{ uri: item.user.avatar_url }}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <Text className="font-bold text-2xl color-gray-600">
                      {(item.user.first_name || "?").charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text className="flex-1 ml-3 font-medium text-lg">
                  {item.user.first_name} {item.user.last_name}
                </Text>
                {startingUserId === item.user.id && (
                  <ActivityIndicator size="small" color="#ef4444" />
                )}
              </Pressable>
            ) : (
              <Pressable
                onPress={() =>
                  router.push(`/channel/${item.message.channel_id}`)
                }
                className="flex-row items-center p-4 border-b border-gray-100"
              >
                <Ionicons name="chatbubble-outline" size={22} color="gray" />
                <View className="flex-1 ml-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm font-medium text-gray-900 flex-1">
                      {item.message.channel_name}
                    </Text>
                    {item.message.created_at && (
                      <Text className="text-xs text-gray-500">
                        {formatDistanceToNow(
                          new Date(item.message.created_at),
                          { addSuffix: true },
                        )}
                      </Text>
                    )}
                  </View>
                  <Text
                    className="text-sm text-gray-600 mt-0.5"
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.message.content}
                  </Text>
                </View>
              </Pressable>
            )
          }
          ListEmptyComponent={
            !searching ? (
              <View className="flex-1 justify-center items-center px-6 pt-16">
                <Text className="text-gray-400 text-center">
                  Sonuç bulunamadı
                </Text>
              </View>
            ) : null
          }
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}
