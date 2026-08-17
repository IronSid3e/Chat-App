import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  View,
} from "react-native";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useState } from "react";
import Text from "./AppText";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSupabase } from "@/providers/SupabaseProvider";
import { Status } from "@/types";
import { withAuthRetry } from "@/utils/withRetry";
import { compressImageForUpload } from "@/utils/image";

type StatusEntry = Status & {
  user_full_name: string;
  user_avatar_url: string | null;
};

const RING_COLOR = "#EA7B7B";

export default function StatusBar() {
  const supabase = useSupabase();
  const { userId } = useAuth();
  const router = useRouter();
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadStatuses = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await withAuthRetry(() =>
        supabase
          .from("statuses")
          .select(
            "id, user_id, image_url, created_at, viewer:profiles(id, full_name, avatar_url)",
          )
          .gte(
            "created_at",
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          )
          .order("created_at", { ascending: false }),
      );
      if (error) throw error;

      const latestByUser = new Map<string, StatusEntry>();
      for (const row of data ?? []) {
        if (!row.viewer) continue;
        if (!latestByUser.has(row.user_id)) {
          latestByUser.set(row.user_id, {
            id: row.id,
            user_id: row.user_id,
            image_url: row.image_url,
            created_at: row.created_at,
            viewer: row.viewer,
            user_full_name: row.viewer.full_name,
            user_avatar_url: row.viewer.avatar_url,
          });
        }
      }
      setStatuses([...latestByUser.values()]);
    } catch (e: any) {
      console.error("Status yüklenemedi:", e?.message);
    }
  }, [supabase, userId]);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  const addStatus = useCallback(async () => {
    if (!userId || uploading) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("İzin gerekli", "Medya kitaplığına erişim izni gerekiyor.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const compressed = await compressImageForUpload(asset.uri, asset.mimeType);
    const mimeType = compressed.mimeType;
    const ext = mimeType.split("/")[1] || "jpg";
    setUploading(true);
    try {
      const path = `${userId}/status-${Date.now()}.${ext}`;
      const arrayBuffer = await fetch(compressed.uri).then((r) =>
        r.arrayBuffer(),
      );
      const { error: uploadError } = await supabase.storage
        .from("status-images")
        .upload(path, arrayBuffer, { contentType: mimeType });
      if (uploadError) throw uploadError;

      const imageUrl = supabase.storage.from("status-images").getPublicUrl(path)
        .data.publicUrl;

      const { error } = await supabase
        .from("statuses")
        .insert({ user_id: userId, image_url: imageUrl })
        .select("id")
        .single();
      if (error) throw error;

      await loadStatuses();
      router.push(`/status/${userId}`);
    } catch (e: any) {
      Alert.alert("Durum eklenemedi", e?.message ?? "Bir hata oluştu.");
    } finally {
      setUploading(false);
    }
  }, [supabase, userId, uploading, loadStatuses, router]);

  return (
    <View className="py-2">
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="pl-4"
        data={[
          { key: "__add__" },
          ...statuses.map((s) => ({ key: s.user_id })),
        ]}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          if (item.key === "__add__") {
            return (
              <Pressable
                onPress={addStatus}
                className="mr-4 items-center"
                disabled={uploading}
                accessibilityRole="button"
                accessibilityLabel="Durum ekle"
                accessibilityState={{ disabled: uploading }}
              >
                <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-white/30 bg-white/20">
                  {uploading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="add" size={28} color="white" />
                  )}
                </View>
                <Text className="mt-1.5 text-xs text-white/80">Durum ekle</Text>
              </Pressable>
            );
          }

          const s = statuses.find((x) => x.user_id === item.key);
          if (!s) return null;
          return (
            <Pressable
              onPress={() => router.push(`/status/${s.user_id}`)}
              className="mr-4 items-center"
              accessibilityRole="button"
              accessibilityLabel={`${s.user_full_name} durumunu gör`}
            >
              <View
                className="h-16 w-16 items-center justify-center rounded-full border-2"
                style={{ borderColor: RING_COLOR }}
              >
                <View className="h-14 w-14 overflow-hidden rounded-full bg-white/20">
                  {s.user_avatar_url ? (
                    <Image
                      source={{ uri: s.user_avatar_url }}
                      className="h-full w-full"
                      contentFit="cover"
                      transition={150}
                      cachePolicy="memory-disk"
                      placeholder="rgba(255,255,255,0.15)"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Text className="text-xl font-bold text-white">
                        {(s.user_full_name || "?").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Text
                className="mt-1.5 max-w-16 text-xs text-white/80"
                numberOfLines={1}
              >
                {s.user_full_name.split(" ")[0]}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
