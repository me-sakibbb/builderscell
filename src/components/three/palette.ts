"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";

export type Palette = ReturnType<typeof makePalette>;

function makePalette(dark: boolean) {
  return {
    dark,
    accent: dark ? "#00d47e" : "#00b86b",
    signal: dark ? "#f42a41" : "#e0233a",
    shell: dark ? "#e9ebe8" : "#1b1f22",
    shellAlt: dark ? "#2a3035" : "#d9dbd6",
    metal: dark ? "#8e979e" : "#6d757b",
    grid: dark ? "#1f262b" : "#d6d7d1",
    gridSection: dark ? "#2d383f" : "#bfc1ba",
    floor: dark ? "#07090a" : "#f5f5f2",
    cardboard: dark ? "#b98b57" : "#c89a63",
    ambient: dark ? 0.35 : 0.9,
    key: dark ? 2.2 : 2.6,
  };
}

/** Scene colors that follow the active theme. Stable per theme. */
export function usePalette() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== "light";
  return useMemo(() => makePalette(dark), [dark]);
}
