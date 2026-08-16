import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSettings } from "@/providers/SettingsProvider";

export default function GradientBackground() {
  const { settings } = useSettings();
  return (
    <>
      <StatusBar style="light" />
      <LinearGradient
        colors={settings.gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
    </>
  );
}
