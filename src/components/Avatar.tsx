import { View, StyleSheet, type ViewStyle } from "react-native";
import { Image, type ImageStyle } from "expo-image";
import React, { memo } from "react";
import Text from "./AppText";
import { colorForName } from "@/utils/color";

type AvatarStyle = ViewStyle & ImageStyle;

type AvatarProps = {
  uri?: string | null;
  name: string;
  size?: number;
  style?: AvatarStyle;
};

function Avatar({ uri, name, size = 56, style }: AvatarProps) {
  const safeName = name || "";
  const initial = safeName.trim().charAt(0).toUpperCase() || "?";
  const fontSize = Math.round(size * 0.4);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
        placeholder="rgba(255,255,255,0.15)"
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colorForName(safeName),
        },
        style,
      ]}
    >
      <Text style={{ fontSize }} className="font-bold text-white">
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default memo(Avatar);
