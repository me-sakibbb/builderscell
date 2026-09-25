"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Institution = {
  id: string;
  name: string;
  short_name: string | null;
  type: string;
  eiin: string | null;
  code: string | null;
};

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 180;

/**
 * Paginated search over the institutions catalogue. Ranking, filtering and paging all
 * happen in Postgres (`search_institutions`); this only holds the page cursor and the
 * in-flight token that keeps a slow response from overwriting a newer query.
 */
export function useInstitutionSearch() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);

  const fetchPage = useCallback(async (q: string, offset: number, token: number) => {
    const { data, error: rpcError } = await createClient().rpc("search_institutions", {
      q,
      lim: PAGE_SIZE,
      off: offset,
    });

    if (token !== requestId.current) return; // a newer query has taken over

    if (rpcError) {
      setError("Could not load the list. Check your connection and try again.");
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const page = (data as Institution[] | null) ?? [];
    setError(null);
    setItems((prev) => (offset === 0 ? page : [...prev, ...page]));
    setHasMore(page.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    const token = ++requestId.current;
    const id = window.setTimeout(() => void fetchPage(query, 0, token), query ? DEBOUNCE_MS : 0);
    return () => window.clearTimeout(id);
  }, [query, fetchPage]);

  /** Call from an input handler: marks the list busy and debounces the new query. */
  const search = useCallback((next: string) => {
    setLoading(true);
    setHasMore(false);
    setQuery(next);
  }, []);

  const loadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    void fetchPage(query, items.length, requestId.current);
  }, [fetchPage, hasMore, items.length, loading, loadingMore, query]);

  return { query, search, items, loading, loadingMore, hasMore, error, loadMore };
}
