import { Canvas, Circle, RadialGradient } from "@shopify/react-native-skia";
import React from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  useSharedValue,
  useFrameCallback,
  useDerivedValue,
} from "react-native-reanimated";
import { useSettings } from "@/providers/SettingsProvider";
import { withOpacity } from "@/utils/color";

const motion = {
  b1: { bx: 0.15, by: 0.2, dx: 70, dy: 55, period: 13000, phase: 0 },
  b2: { bx: 0.88, by: 0.45, dx: 75, dy: 60, period: 11500, phase: 1.7 },
  b3: { bx: 0.55, by: 0.98, dx: 85, dy: 48, period: 14500, phase: 3.1 },
};

export default function GradientBackground() {
  const { settings } = useSettings();
  const { width: w, height: h } = useWindowDimensions();

  const t = useSharedValue(0);

  useFrameCallback((info) => {
    "worklet";
    t.value = info.timestamp;
  });

  const colors = settings.gradientColors;
  const c0 = colors[0] ?? "#3a1740";
  const c1 = colors[1] ?? "#8a1f6b";
  const c2 = (colors[2] ?? colors[1]) ?? "#1a0e1f";

  const max = Math.max(w, h);

  const b1x = useDerivedValue(() => {
    "worklet";
    return (
      w * motion.b1.bx +
      Math.sin((t.value / motion.b1.period) * Math.PI * 2 + motion.b1.phase) *
        motion.b1.dx
    );
  });
  const b1y = useDerivedValue(() => {
    "worklet";
    return (
      h * motion.b1.by +
      Math.sin(
        (t.value / motion.b1.period) * Math.PI * 2 + motion.b1.phase * 0.6,
      ) * motion.b1.dy
    );
  });

  const b2x = useDerivedValue(() => {
    "worklet";
    return (
      w * motion.b2.bx +
      Math.sin((t.value / motion.b2.period) * Math.PI * 2 + motion.b2.phase) *
        motion.b2.dx
    );
  });
  const b2y = useDerivedValue(() => {
    "worklet";
    return (
      h * motion.b2.by +
      Math.sin(
        (t.value / motion.b2.period) * Math.PI * 2 + motion.b2.phase * 0.7,
      ) * motion.b2.dy
    );
  });

  const b3x = useDerivedValue(() => {
    "worklet";
    return (
      w * motion.b3.bx +
      Math.sin((t.value / motion.b3.period) * Math.PI * 2 + motion.b3.phase) *
        motion.b3.dx
    );
  });
  const b3y = useDerivedValue(() => {
    "worklet";
    return (
      h * motion.b3.by +
      Math.sin(
        (t.value / motion.b3.period) * Math.PI * 2 + motion.b3.phase * 0.5,
      ) * motion.b3.dy
    );
  });

  const r1 = max * 0.55;
  const r2 = max * 0.45;
  const r3 = max * 0.6;

  const c1Pos = useDerivedValue(() => ({ x: b1x.value, y: b1y.value }));
  const c2Pos = useDerivedValue(() => ({ x: b2x.value, y: b2y.value }));
  const c3Pos = useDerivedValue(() => ({ x: b3x.value, y: b3y.value }));

  const gradColors1 = [withOpacity(c0, 0.95), withOpacity(c0, 0)];
  const gradColors2 = [withOpacity(c1, 0.85), withOpacity(c1, 0)];
  const gradColors3 = [withOpacity(c2, 0.95), withOpacity(c2, 0)];

  return (
    <>
      <StatusBar style="light" />
      <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Circle cx={b1x} cy={b1y} r={r1}>
          <RadialGradient c={c1Pos} r={r1} colors={gradColors1} />
        </Circle>
        <Circle cx={b2x} cy={b2y} r={r2}>
          <RadialGradient c={c2Pos} r={r2} colors={gradColors2} />
        </Circle>
        <Circle cx={b3x} cy={b3y} r={r3}>
          <RadialGradient c={c3Pos} r={r3} colors={gradColors3} />
        </Circle>
      </Canvas>
    </>
  );
}
