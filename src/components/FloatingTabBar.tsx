import { Animated, Platform, Pressable, StyleSheet, View } from "react-native";
import React, { ReactNode, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Text from "./AppText";
import { useSettings } from "@/providers/SettingsProvider";
import { withOpacity } from "@/utils/color";

type TabButtonProps = {
  onPress: () => void;
  active: boolean;
  tint: string;
  icon: ReactNode | null;
  label: string;
};

function TabButton({ onPress, active, tint, icon, label }: TabButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.85,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      android_ripple={{ color: "rgba(255,255,255,0.08)" }}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale }] }]}>
        {icon}
        <Text
          style={[
            styles.label,
            { color: active ? "#FFFFFF" : "rgba(255,255,255,0.5)" },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { settings } = useSettings();
  const [c0, c1] = settings.gradientColors;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <LinearGradient
        colors={
          [
            withOpacity(c0 ?? "#3a1740", 0.85),
            withOpacity(c1 ?? "#8a1f6b", 0.85),
          ] as [string, string, ...string[]]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bar}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const tint = isFocused ? "#FFFFFF" : "rgba(255,255,255,0.5)";

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const icon = options.tabBarIcon
            ? options.tabBarIcon({
                focused: isFocused,
                color: tint,
                size: 24,
              })
            : null;

          return (
            <TabButton
              key={route.key}
              onPress={onPress}
              active={isFocused}
              tint={tint}
              icon={icon}
              label={options.title ?? route.name}
            />
          );
        })}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: Platform.OS === "ios" ? 30 : 20,
  },
  bar: {
    flexDirection: "row",
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  tab: {
    flex: 1,
  },
  tabInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
});
