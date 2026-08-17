import { Image, Pressable, View } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import Text from "@/components/AppText";
import { useSupabase } from "@/providers/SupabaseProvider";
import { Status } from "@/types";
import { withAuthRetry } from "@/utils/withRetry";

const STATUS_DURATION = 5000;

export default function StatusViewer() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const supabase = useSupabase();
  const { userId: authId } = useAuth();
  const router = useRouter();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await withAuthRetry(() =>
        supabase
          .from("statuses")
          .select(
            "id, user_id, image_url, created_at, viewer:profiles(id, full_name, avatar_url)",
          )
          .eq("user_id", userId)
          .gte(
            "created_at",
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          )
          .order("created_at", { ascending: true }),
      );
      if (error) throw error;
      setStatuses((data ?? []).filter((s) => s.viewer));
      setIndex(0);
    } catch (e: any) {
      setError(e?.message ?? "Durumlar yüklenemedi.");
    }
  }, [supabase, userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (statuses.length === 0) return;
    const current = statuses[index];
    if (!current) return;

    setProgress(0);
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(elapsed / STATUS_DURATION, 1));
      if (elapsed >= STATUS_DURATION) {
        clearInterval(timer);
        if (index + 1 < statuses.length) {
          setIndex((i) => i + 1);
        } else {
          router.back();
        }
      }
    }, 100);

    return () => clearInterval(timer);
  }, [statuses, index, router]);

  const current = statuses[index];
  const isOwn = userId === authId;

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6">
        <Text className="mb-4 text-center text-red-400">{error}</Text>
        <Pressable onPress={() => router.back()}>
          <Text className="font-semibold text-white">Geri Dön</Text>
        </Pressable>
      </View>
    );
  }

  if (!current) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white/70">Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <ExpoStatusBar style="light" />

      <Image
        source={{ uri: current.image_url }}
        className="absolute inset-0 h-full w-full"
        resizeMode="contain"
      />

      <View className="absolute inset-0 bg-black/30" />

      <View className="absolute inset-x-0 top-0 gap-1.5 p-4 pt-10">
        {statuses.map((s, i) => (
          <View
            key={s.id}
            className="h-1 overflow-hidden rounded-full bg-white/25"
          >
            <View
              className="h-full bg-white"
              style={{
                width:
                  i < index
                    ? "100%"
                    : i === index
                      ? `${progress * 100}%`
                      : "0%",
              }}
            />
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => setIndex((i) => Math.max(0, i - 1))}
        className="absolute bottom-0 left-0 top-0 z-10 w-1/2"
      />

      <Pressable
        onPress={() => setIndex((i) => Math.min(statuses.length - 1, i + 1))}
        className="absolute bottom-0 right-0 top-0 z-10 w-1/2"
      />

      <View className="absolute inset-x-0 top-0 z-20 flex-row items-center px-4 pt-14">
        <View className="h-10 w-10 overflow-hidden rounded-full bg-white/20">
          {current.viewer?.avatar_url ? (
            <Image
              source={{ uri: current.viewer.avatar_url }}
              className="h-full w-full"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="font-bold text-white">
                {(current.viewer?.full_name || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text className="ml-3 flex-1 font-semibold text-white">
          {current.viewer?.full_name}
        </Text>
        {isOwn && <Text className="mr-3 text-xs text-white/80">Sen</Text>}
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={28} color="white" />
        </Pressable>
      </View>
    </View>
  );
}
