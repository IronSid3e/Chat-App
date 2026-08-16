import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  type TextStyle,
  type TextProps,
} from "react-native";

type AppTextProps = TextProps & {
  className?: string;
};

const DEFAULT_LINE_HEIGHT_MULTIPLIER = 1.35;

const STANDARD_TEXT_SIZE_TOKENS = new Set([
  "text-xs",
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
  "text-2xl",
  "text-3xl",
  "text-4xl",
  "text-5xl",
  "text-6xl",
  "text-7xl",
  "text-8xl",
  "text-9xl",
]);

const FONT_WEIGHT_TOKENS: Record<string, number> = {
  "font-thin": 100,
  "font-extralight": 200,
  "font-light": 300,
  "font-normal": 400,
  "font-medium": 500,
  "font-semibold": 600,
  "font-bold": 700,
  "font-extrabold": 800,
  "font-black": 900,
};

const FONT_FAMILY_TOKENS = new Set(["font-sans", "font-serif", "font-mono"]);

type InterFontWeight = "400" | "500" | "600" | "700";

const INTER_FONT_BY_WEIGHT: Record<InterFontWeight, string> = {
  "400": "Inter_400Regular",
  "500": "Inter_500Medium",
  "600": "Inter_600SemiBold",
  "700": "Inter_700Bold",
};

function normalizeFontWeight(
  weight: string | number | undefined,
): number | undefined {
  if (weight === undefined) return undefined;
  if (typeof weight === "number") return weight;
  const named: Record<string, number> = {
    normal: 400,
    bold: 700,
  };
  if (named[weight] !== undefined) return named[weight];
  const numeric = Number(weight);
  return Number.isNaN(numeric) ? undefined : numeric;
}

function resolveFontFamily(
  className?: string,
  flatStyle?: TextStyle | undefined,
): { fontFamily?: string; fontWeight?: InterFontWeight } | undefined {
  if (typeof flatStyle?.fontFamily === "string") return undefined;

  const tokens = className?.split(/\s+/) ?? [];
  let classNameFontWeight: number | undefined;
  let hasClassNameFontFamily = false;
  for (const token of tokens) {
    if (FONT_FAMILY_TOKENS.has(token)) hasClassNameFontFamily = true;
    else if (FONT_WEIGHT_TOKENS[token] !== undefined)
      classNameFontWeight = FONT_WEIGHT_TOKENS[token];
    else if (token.startsWith("font-[")) hasClassNameFontFamily = true;
  }
  if (hasClassNameFontFamily) return undefined;

  const fontWeight = normalizeFontWeight(
    flatStyle?.fontWeight ?? classNameFontWeight ?? 400,
  );
  if (fontWeight === undefined) return undefined;

  let key: InterFontWeight;
  if (fontWeight <= 400) key = "400";
  else if (fontWeight === 500) key = "500";
  else if (fontWeight <= 600) key = "600";
  else key = "700";
  return { fontFamily: INTER_FONT_BY_WEIGHT[key], fontWeight: key };
}

function getClassNameTypography(
  className?: string,
): { fontSize?: number; hasBundledLineHeight: boolean } {
  if (!className) return { hasBundledLineHeight: false };
  const tokens = className.split(/\s+/);
  let fontSize: number | undefined;
  let hasStandardToken = false;
  let hasLeadingToken = false;
  for (const token of tokens) {
    if (STANDARD_TEXT_SIZE_TOKENS.has(token)) hasStandardToken = true;
    else if (token.startsWith("leading-")) hasLeadingToken = true;
    else {
      const arbitrary = token.match(/^text-\[(\d+(?:\.\d+)?)px\]$/);
      if (arbitrary) fontSize = Math.round(parseFloat(arbitrary[1]));
    }
  }
  return {
    fontSize,
    hasBundledLineHeight: hasStandardToken || hasLeadingToken,
  };
}

export default function AppText({
  className,
  style,
  maxFontSizeMultiplier,
  ...props
}: AppTextProps) {
  const isAndroid = Platform.OS === "android";

  const { fontSize: classFontSize, hasBundledLineHeight } =
    getClassNameTypography(className);

  const flatStyle = StyleSheet.flatten(style);
  const fontSize =
    typeof flatStyle?.fontSize === "number" ? flatStyle.fontSize : classFontSize;
  const hasLineHeight =
    typeof flatStyle?.lineHeight === "number" || hasBundledLineHeight;
  const lineHeight =
    fontSize && !hasLineHeight
      ? Math.round(fontSize * DEFAULT_LINE_HEIGHT_MULTIPLIER)
      : undefined;

  const resolvedFont = resolveFontFamily(className, flatStyle);

  return (
    <Text
      {...props}
      className={className}
      textBreakStrategy={isAndroid ? "simple" : undefined}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? 1.2}
      style={[
        isAndroid && { includeFontPadding: false },
        lineHeight ? { lineHeight } : undefined,
        resolvedFont,
        style,
      ]}
    />
  );
}
