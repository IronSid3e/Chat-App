import { ActivityIndicator, Pressable, TextInput, View } from "react-native";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

export type SearchFilter = "all" | "users" | "messages";

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  searching: boolean;
  onClear: () => void;
  filter: SearchFilter;
  onCycleFilter: () => void;
};

export default function SearchBar({
  value,
  onChangeText,
  searching,
  onClear,
  filter,
  onCycleFilter,
}: SearchBarProps) {
  return (
    <View className="px-4 pt-3">
      <View className="h-12 flex-row items-center rounded-3xl border border-white/20 bg-white/15 px-4">
        <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
        <TextInput
          className="ml-2 flex-1 text-base text-white"
          placeholder="Kullanıcı veya mesaj ara"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searching && <ActivityIndicator size="small" color="#EA7B7B" />}
        {value.length > 0 && (
          <Pressable
            onPress={onClear}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Aramayı temizle"
          >
            <Ionicons
              name="close-circle"
              size={18}
              color="rgba(255,255,255,0.6)"
            />
          </Pressable>
        )}
        <View className="mx-2 h-5 w-px bg-white/20" />
        <Pressable
          onPress={onCycleFilter}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Filtrele"
          accessibilityState={{
            selected: filter !== "all",
          }}
        >
          <Ionicons
            name="filter"
            size={20}
            color={filter === "all" ? "rgba(255,255,255,0.7)" : "#EA7B7B"}
          />
        </Pressable>
      </View>
    </View>
  );
}
