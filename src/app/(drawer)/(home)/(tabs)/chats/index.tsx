import {
  View,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  TextInput,
  Keyboard,
  SectionList,
  Image,
  Alert,
} from "react-native";
import Text from "@/components/AppText";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import ChannelListItem from "@/components/ChannelListItem";
import StatusBar from "@/components/StatusBar";
import { useSupabase } from "@/providers/SupabaseProvider";
import { withAuthRetry } from "@/utils/withRetry";
import { ensureDirectMessage } from "@/utils/dm";
import Ionicons from "@expo/vector-icons/Ionicons";
import { formatMessageTime } from "@/utils/formatMessageTime";
import { Channel, Message, User } from "@/types";

type LastMessage = Pick<Message, "id" | "content" | "image_url" | "created_at">;

type LastMessageRow = LastMessage & { channel_id: string };

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

type SearchFilter = "all" | "users" | "messages";

export default function ChannelListScreen() {
  const supabase = useSupabase();
  const { userId } = useAuth();
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [searchUsers, setSearchUsers] = useState<User[]>([]);
  const [searchMessages, setSearchMessages] = useState<MessageResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [startingUserId, setStartingUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<SearchFilter>("all");

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

  const runSearch = useCallback(
    async (q: string) => {
      const term = q.trim().replace(/%/g, "");
      if (!term || !userId) {
        setSearchUsers([]);
        setSearchMessages([]);
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
            .select(
              "id, channel_id, content, image_url, created_at, channels(name)",
            )
            .ilike("content", `%${term}%`)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

        if (profilesRes.error) throw profilesRes.error;
        if (messagesRes.error) throw messagesRes.error;

        setSearchUsers(profilesRes.data ?? []);
        setSearchMessages(
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

  const hasQuery = query.trim().length > 0;

  const sections = useMemo(() => {
    const s: { title: string; data: Row[] }[] = [];
    if (filter !== "messages" && searchUsers.length > 0) {
      s.push({
        title: "Kullanıcılar",
        data: searchUsers.map((u) => ({ type: "user", user: u })),
      });
    }
    if (filter !== "users" && searchMessages.length > 0) {
      s.push({
        title: "Mesajlar",
        data: searchMessages.map((m) => ({ type: "message", message: m })),
      });
    }
    return s;
  }, [searchUsers, searchMessages, filter]);

  const cycleFilter = () => {
    setFilter((f) =>
      f === "all" ? "users" : f === "users" ? "messages" : "all",
    );
  };

  const searchBar = (
    <View className="px-4 pt-3">
      <View className="flex-row items-center bg-white/15 rounded-3xl px-4 h-12 border border-white/20">
        <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
        <TextInput
          className="flex-1 ml-2 text-white text-base"
          placeholder="Kullanıcı veya mesaj ara"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searching && <ActivityIndicator size="small" color="#EA7B7B" />}
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons
              name="close-circle"
              size={18}
              color="rgba(255,255,255,0.6)"
            />
          </Pressable>
        )}
        <View className="w-px h-5 bg-white/20 mx-2" />
        <Pressable onPress={cycleFilter} hitSlop={8}>
          <Ionicons
            name="filter"
            size={20}
            color={
              filter === "all" ? "rgba(255,255,255,0.7)" : "#EA7B7B"
            }
          />
        </Pressable>
      </View>
    </View>
  );

  const renderResultRow = ({ item }: { item: Row }) => {
    if (item.type === "user") {
      return (
        <Pressable
          onPress={() => startChat(item.user)}
          className="flex-row items-center p-4 border-b border-white/10"
        >
          <View className="bg-white/20 w-12 h-12 items-center justify-center rounded-full">
            {item.user.avatar_url ? (
              <Image
                source={{ uri: item.user.avatar_url }}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <Text className="font-bold text-2xl text-white">
                {(item.user.first_name || "?").charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text className="flex-1 ml-3 font-medium text-lg text-white">
            {item.user.first_name} {item.user.last_name}
          </Text>
          {startingUserId === item.user.id && (
            <ActivityIndicator size="small" color="#EA7B7B" />
          )}
        </Pressable>
      );
    }
    return (
      <Pressable
        onPress={() => router.push(`/channel/${item.message.channel_id}`)}
        className="flex-row items-center p-4 border-b border-white/10"
      >
        <View className="w-11 h-11 rounded-full bg-white/20 items-center justify-center">
          <Ionicons name="chatbubble-outline" size={22} color="white" />
        </View>
        <View className="flex-1 ml-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm font-medium text-white flex-1">
              {item.message.channel_name}
            </Text>
            {item.message.created_at && (
              <Text className="text-xs text-white/60">
                {formatMessageTime(item.message.created_at)}
              </Text>
            )}
          </View>
          <Text
            className="text-sm text-white/70 mt-0.5"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.message.content}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 pt-24 justify-center items-center">
        <ActivityIndicator size="large" color="#EA7B7B" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 pt-24 justify-center items-center px-6">
        <Text className="text-red-400 text-center mb-4">{error}</Text>
        <Pressable
          onPress={() => {
            setLoading(true);
            loadChannels();
          }}
        >
          <Text className="text-white font-semibold">Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 pt-24">
      {searchBar}
      {hasQuery ? (
        <SectionList
          keyboardShouldPersistTaps="handled"
          sections={sections}
          keyExtractor={(row, index) =>
            row.type === "user" ? `u-${row.user.id}` : `m-${row.message.id}`
          }
          renderSectionHeader={({ section }) => (
            <Text className="px-4 pt-3 pb-1 text-xs font-semibold text-white/60 uppercase">
              {section.title}
            </Text>
          )}
          renderItem={renderResultRow}
          ListEmptyComponent={
            !searching ? (
              <View className="flex-1 justify-center items-center px-6 pt-16">
                <Text className="text-white/60 text-center">
                  Sonuç bulunamadı
                </Text>
              </View>
            ) : null
          }
          contentContainerClassName="pb-28"
        />
      ) : (
        <>
          <StatusBar />
          {channels.length === 0 ? (
            <View className="flex-1 justify-center items-center px-6">
              <Text className="text-white/70 text-lg">Henüz sohbetin yok</Text>
              <Text className="text-white/50 mt-2 text-center">
                Yeni sohbet başlatmak için menüdeki kullanıcılardan birini seç
              </Text>
            </View>
          ) : (
            <FlatList
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={Keyboard.dismiss}
              showsVerticalScrollIndicator={false}
              data={channels}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ChannelListItem channel={item} />}
              contentContainerClassName="pb-28"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    loadChannels();
                  }}
                  tintColor="#EA7B7B"
                />
              }
            />
          )}
        </>
      )}
    </View>
  );
}
