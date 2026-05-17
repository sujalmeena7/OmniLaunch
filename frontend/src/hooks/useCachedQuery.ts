"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Simple in-memory cache shared across hook instances.
 * Implements stale-while-revalidate: returns cached data immediately,
 * then fetches fresh data in the background.
 */
const cache = new Map<string, CacheEntry<unknown>>();

interface UseCachedQueryOptions {
  /** Time in ms before cached data is considered stale (default: 30s) */
  staleTime?: number;
  /** Time in ms before cached data is evicted entirely (default: 5min) */
  cacheTime?: number;
  /** Whether to fetch on mount (default: true) */
  enabled?: boolean;
}

interface UseCachedQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isStale: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook that caches API responses and serves stale data while revalidating.
 * Prevents redundant network requests and makes navigation feel instant.
 *
 * @param key - Unique cache key for this query
 * @param fetcher - Async function that returns the data
 * @param options - Configuration options
 */
export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCachedQueryOptions = {}
): UseCachedQueryResult<T> {
  const { staleTime = 30_000, cacheTime = 300_000, enabled = true } = options;

  const [data, setData] = useState<T | null>(() => {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    if (entry && Date.now() - entry.timestamp < cacheTime) {
      return entry.data;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!data);
  const [isStale, setIsStale] = useState(() => {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return true;
    return Date.now() - entry.timestamp > staleTime;
  });
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refetch = useCallback(async () => {
    try {
      const freshData = await fetcherRef.current();
      cache.set(key, { data: freshData, timestamp: Date.now() });
      setData(freshData);
      setIsStale(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Fetch failed"));
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  useEffect(() => {
    if (!enabled) return;

    const entry = cache.get(key) as CacheEntry<T> | undefined;

    if (entry && Date.now() - entry.timestamp < cacheTime) {
      // Serve cached data immediately
      setData(entry.data);
      setIsLoading(false);

      // If stale, revalidate in background
      if (Date.now() - entry.timestamp > staleTime) {
        setIsStale(true);
        refetch();
      } else {
        setIsStale(false);
      }
    } else {
      // No cache or expired — fetch fresh
      setIsLoading(true);
      refetch();
    }
  }, [key, enabled, staleTime, cacheTime, refetch]);

  return { data, isLoading, isStale, error, refetch };
}

/**
 * Invalidate a specific cache entry (e.g., after a mutation).
 */
export function invalidateCache(key: string) {
  cache.delete(key);
}

/**
 * Invalidate all cache entries matching a prefix.
 */
export function invalidateCacheByPrefix(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

export default useCachedQuery;
