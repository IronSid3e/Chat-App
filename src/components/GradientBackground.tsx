import { Canvas, Circle, RadialGradient } from "@shopify/react-native-skia";
import React, { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSettings } from "@/providers/SettingsProvider";
import { withOpacity } from "@/utils/color";

type Blob = {
  x: number;
  y: number;
};

const motion = {
  b1: { bx: 0.15, by: 0.2, dx: 70, dy: 55, period: 13000, phase: 0 },
  b2: { bx: 0.88, by: 0.45, dx: 75, dy: 60, period: 11500, phase: 1.7 },
  b3: { bx: 0.55, by: 0.98, dx: 85, dy: 48, period: 14500, phase: 3.1 },
};

function offset(t: number, period: number, phase: number, amp: number) {
  return Math.sin((t / period) * Math.PI * 2 + phase) * amp;
}

export default function GradientBackground() {
  const { settings } = useSettings();
  const { width: w, height: h } = useWindowDimensions();
  const [t, setT] = useState(0);

  useEffect(() => {
    let raf: number;
    let last = 0;
    const tick = (now: number) => {
      if (now - last >= 33) {
        setT(now);
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const colors = settings.gradientColors;
  const c0 = colors[0] ?? "#3a1740";
  const c1 = colors[1] ?? "#8a1f6b";
  const c2 = colors[2] ?? c1;
  const max = Math.max(w, h);

  const blobs: Blob[] = [
    {
      x:
        w * motion.b1.bx +
        offset(t, motion.b1.period, motion.b1.phase, motion.b1.dx),
      y:
        h * motion.b1.by +
        offset(t, motion.b1.period, motion.b1.phase * 0.6, motion.b1.dy),
    },
    {
      x:
        w * motion.b2.bx +
        offset(t, motion.b2.period, motion.b2.phase, motion.b2.dx),
      y:
        h * motion.b2.by +
        offset(t, motion.b2.period, motion.b2.phase * 0.7, motion.b2.dy),
    },
    {
      x:
        w * motion.b3.bx +
        offset(t, motion.b3.period, motion.b3.phase, motion.b3.dx),
      y:
        h * motion.b3.by +
        offset(t, motion.b3.period, motion.b3.phase * 0.5, motion.b3.dy),
    },
  ];
  const colorsPerBlob = [c0, c1, c2];
  const radii = [max * 0.55, max * 0.45, max * 0.6];
  const alphas = [0.95, 0.85, 0.95];

  return (
    <>
      <StatusBar style="light" />
      <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {blobs.map((b, i) => (
          <Circle key={i} cx={b.x} cy={b.y} r={radii[i]}>
            <RadialGradient
              c={{ x: b.x, y: b.y }}
              r={radii[i]}
              colors={[
                withOpacity(colorsPerBlob[i], alphas[i]),
                withOpacity(colorsPerBlob[i], 0),
              ]}
            />
          </Circle>
        ))}
      </Canvas>
    </>
  );
}
