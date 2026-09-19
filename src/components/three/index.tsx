"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/cn";
import type { SceneProps } from "./scene-view";

/*
 * Client-only entry points. Three.js, drei and the scenes load as a separate
 * chunk after the HTML is interactive; until then each slot is an empty box.
 */

export const Canvas3D = dynamic(() => import("./canvas-root"), { ssr: false });

const LazySceneView = dynamic(() => import("./scene-view"), {
  ssr: false,
  loading: () => null,
});

export function Scene({ className, ...props }: SceneProps & { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <LazySceneView {...props} className="absolute inset-0" />
    </div>
  );
}
