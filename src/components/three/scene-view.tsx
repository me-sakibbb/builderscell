"use client";

import { Suspense, type RefObject } from "react";
import { View } from "@react-three/drei";
import HeroScene from "./hero-scene";
import KitScene from "./kit-scene";
import RoverScene from "./rover-scene";
import type { HeroState, KitState, RoverControls, RoverTelemetry } from "./bus";

export type SceneProps =
  | { scene: "hero"; state: RefObject<HeroState> }
  | { scene: "kit"; state: RefObject<KitState> }
  | { scene: "rover"; controls: RefObject<RoverControls>; telemetryRef: RefObject<RoverTelemetry>; onTelemetry?: () => void };

export default function SceneView({ className, ...props }: SceneProps & { className?: string }) {
  return (
    <View className={className}>
      <Suspense fallback={null}>
        {props.scene === "hero" && <HeroScene state={props.state} />}
        {props.scene === "kit" && <KitScene state={props.state} />}
        {props.scene === "rover" && (
          <RoverScene controls={props.controls} telemetryRef={props.telemetryRef} onTelemetry={props.onTelemetry} />
        )}
      </Suspense>
    </View>
  );
}
