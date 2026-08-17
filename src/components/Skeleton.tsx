import React, { useEffect, useState } from "react";
import { MotiView } from "moti";

export function SkeletonBar({ className }: { className: string }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => !p), 800);
    return () => clearInterval(id);
  }, []);

  return (
    <MotiView
      animate={{ opacity: pulse ? 0.6 : 0.3 }}
      transition={{ type: "timing", duration: 800 }}
      className={`rounded-full bg-white/20 ${className}`}
    />
  );
}
