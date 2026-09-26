"use client";

import { useCallback, useState } from "react";
import { RAIL_COOKIE } from "@/components/shell/nav";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Collapse state for the desktop rail. Seeded with the value the shell layout read off
 *  the cookie, and written straight back on toggle - no round trip, and the next request
 *  renders the same width, so there is nothing to flash. */
export function useRail(initialCollapsed: boolean) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      document.cookie = `${RAIL_COOKIE}=${next ? "1" : "0"}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
      return next;
    });
  }, []);

  return { collapsed, toggle };
}
