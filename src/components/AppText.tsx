import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  type TextProps,
} from "react-native";

type AppTextProps = TextProps & {
  className?: string;
};

const DEFAULT_LINE_HEIGHT_MULTIPLIER = 1.35;

export default function AppText({
  className,
  style,
  maxFontSizeMultiplier,
  ...props
}: AppTextProps) {
  const isAndroid = Platform.OS === "android";

  const flatStyle = StyleSheet.flatten(style);
  const fontSize =
    typeof flatStyle?.fontSize === "number" ? flatStyle.fontSize : undefined;
  const hasLineHeight = typeof flatStyle?.lineHeight === "number";
  const lineHeight =
    fontSize && !hasLineHeight
      ? Math.round(fontSize * DEFAULT_LINE_HEIGHT_MULTIPLIER)
      : undefined;

  return (
    <Text
      {...props}
      className={className}
      textBreakStrategy={isAndroid ? "simple" : undefined}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? 1.5}
      style={[
        isAndroid && { includeFontPadding: false },
        lineHeight ? { lineHeight } : undefined,
        style,
      ]}
    />
  );
}
