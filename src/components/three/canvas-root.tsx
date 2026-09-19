"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, View } from "@react-three/drei";
import { useState } from "react";

/**
 * The one WebGL context for the whole page. Sections render into it through
 * drei <View>, which scissors each scene into its tracked DOM rectangle and
 * skips views that are off-screen.
 */
export default function CanvasRoot() {
  const [dpr, setDpr] = useState(1.5);
  return (
    <Canvas
      shadows
      dpr={[1, dpr]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100lvh", zIndex: 5, pointerEvents: "none" }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.75)} />
      <AdaptiveDpr pixelated={false} />
      <View.Port />
    </Canvas>
  );
}
