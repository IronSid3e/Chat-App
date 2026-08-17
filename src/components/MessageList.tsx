import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
  type ListRenderItemInfo,
} from "react-native";
import Text from "./AppText";
import React, { useCallback, useMemo, useRef } from "react";
import MessageListItem from "./MessageListItem";
import MessageListItemSkeleton from "./MessageListItemSkeleton";
import { Message } from "@/types";
import { format, isToday, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";

type MessageListProps = {
  messages: Message[];
  loading: boolean;
  error: string | null;
  myUserId?: string | null;
  onRetry: () => void;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
};

type Row =
  { type: "message"; message: Message } | { type: "date"; day: string };

function dayLabel(date: string): string {
  const d = new Date(date);
  if (isToday(d)) return "Bugün";
  if (isYesterday(d)) return "Dün";
  return format(d, "d MMMM yyyy", { locale: tr });
}

export default function MessageList({
  messages,
  loading,
  error,
  myUserId,
  onRetry,
  onLoadMore,
  loadingMore,
  hasMore,
}: MessageListProps) {
  const initialIds = useRef<Set<string> | null>(null);
  if (initialIds.current === null) {
    initialIds.current = new Set(messages.map((m) => m.id));
  }

  const dayLabels = useRef<Map<string, string>>(new Map());

  const rows = useMemo<Row[]>(() => {
    const labelCache = dayLabels.current;
    const result: Row[] = [];
    let prevDay: string | null = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const createdAt = messages[i].created_at;
      const dayKey = createdAt.slice(0, 10);
      let label = labelCache.get(dayKey);
      if (!label) {
        label = dayLabel(createdAt);
        labelCache.set(dayKey, label);
      }
      if (label !== prevDay) {
        result.push({ type: "date", day: label });
        prevDay = label;
      }
      result.push({ type: "message", message: messages[i] });
    }
    return result.reverse();
  }, [messages]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Row>) => {
      if (item.type === "date") {
        return (
          <View className="my-3 items-center">
            <Text className="rounded-full bg-white/15 px-3 py-1 text-xs leading-4 text-white/70">
              {item.day}
            </Text>
          </View>
        );
      }
      return (
        <MessageListItem
          message={item.message}
          isOwnMessage={item.message.sender_id === myUserId}
          animateIn={
            index === 0 &&
            !initialIds.current!.has(item.message.id) &&
            item.message.id !== undefined
          }
        />
      );
    },
    [myUserId],
  );

  if (loading) {
    return (
      <View className="flex-1 justify-end px-2 pb-2">
        {[0, 1, 2, 3].map((i) => (
          <MessageListItemSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="mb-3 text-center leading-5 text-red-500">{error}</Text>
        <Pressable onPress={onRetry}>
          <Text className="font-semibold leading-5 text-blue-500">
            Tekrar Dene
          </Text>
        </Pressable>
      </View>
    );
  }

  if (messages.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center leading-5 text-white/60">
          Henüz mesaj yok. İlk mesajı sen yaz!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) =>
        item.type === "date" ? `d-${item.day}` : item.message.id
      }
      contentContainerClassName="p-3"
      renderItem={renderItem}
      inverted
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      initialNumToRender={20}
      maxToRenderPerBatch={20}
      windowSize={7}
      updateCellsBatchingPeriod={50}
      onEndReached={hasMore ? onLoadMore : undefined}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        loadingMore ? (
          <View className="items-center py-3">
            <ActivityIndicator size="small" color="#EA7B7B" />
          </View>
        ) : null
      }
    />
  );
}
