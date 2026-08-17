import * as Sentry from "@sentry/react-native";
import {
  View,
  FlatList,
  Pressable,
  RefreshControl,
  Keyboard,
  Alert,
} from "react-native";
import Text from "@/components/AppText";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import ChannelListItem from "@/components/ChannelListItem";
import ChannelListItemSkeleton from "@/components/ChannelListItemSkeleton";
import SearchBar, { SearchFilter } from "@/components/search/SearchBar";
import SearchResultsList, {
  MessageResult,
  SearchSection,
} from "@/components/search/SearchResultsList";
import StatusBar from "@/components/StatusBar";
import { useSupabase } from "@/providers/SupabaseProvider";
import { withAuthRetry } from "@/utils/withRetry";
import { ensureDirectMessage } from "@/utils/dm";
import { Channel, Message, User } from "@/types";

type LastMessage = Pick<Message, "id" | "content" | "image_url" | "created_at">;

type LastMessageRow = LastMessage & { channel_id: string };

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
      Sentry.captureException(e);
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

  const channelIdsKey = channels
    .map((c) => c.id)
    .sort()
    .join(",");

  useEffect(() => {
    if (channelIdsKey.length === 0) return;

    const channel = supabase
      .channel("channel-list")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=in.(${channelIdsKey})`,
        },
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
  }, [supabase, channelIdsKey]);

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
        Sentry.captureException(e);
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
        Sentry.captureException(e);
        Alert.alert("Sohbet başlatılamadı", e?.message ?? "Bir hata oluştu.");
      } finally {
        setStartingUserId(null);
      }
    },
    [supabase, userId, startingUserId, router],
  );

  const hasQuery = query.trim().length > 0;

  const sections = useMemo<SearchSection[]>(() => {
    const s: SearchSection[] = [];
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

  if (loading) {
    return (
      <View className="flex-1 pt-24">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ChannelListItemSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6 pt-24">
        <Text className="mb-4 text-center text-red-400">{error}</Text>
        <Pressable
          onPress={() => {
            setLoading(true);
            loadChannels();
          }}
        >
          <Text className="font-semibold text-white">Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 pt-24">
      <SearchBar
        value={query}
        onChangeText={setQuery}
        searching={searching}
        onClear={() => setQuery("")}
        filter={filter}
        onCycleFilter={cycleFilter}
      />
      {hasQuery ? (
        <SearchResultsList
          sections={sections}
          searching={searching}
          startingUserId={startingUserId}
          onUserPress={startChat}
          onMessagePress={(channelId) => router.push(`/channel/${channelId}`)}
        />
      ) : (
        <>
          <StatusBar />
          {channels.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-lg text-white/70">Henüz sohbetin yok</Text>
              <Text className="mt-2 text-center text-white/50">
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
