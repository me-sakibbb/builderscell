import { useCallback, useSyncExternalStore } from "react";

/** Subscribes to a media query. Returns `fallback` during SSR. */
export function useMedia(query: string, fallback = false) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}

export const useReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");
export const useIsDesktop = () => useMedia("(min-width: 768px)", true);
