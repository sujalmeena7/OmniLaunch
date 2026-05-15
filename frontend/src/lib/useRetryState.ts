/* ============================================================
   OmniLaunch — useRetryState Hook
   ============================================================
   Allows components to subscribe to retry state for a specific
   API path, enabling subtle loading indicators during retries.
   ============================================================ */

"use client";

import { useEffect, useState } from "react";
import { onRetryStateChange, RetryState } from "@/lib/api";

/**
 * Hook that subscribes to retry state changes for a specific API path.
 * Components can use this to show a subtle loading indicator while
 * the API client is retrying a failed request.
 *
 * @param path - The API path to monitor (e.g., "/bundles")
 * @returns The current retry state for the given path
 */
export function useRetryState(path: string): RetryState {
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
  });

  useEffect(() => {
    const unsubscribe = onRetryStateChange((changedPath, state) => {
      if (changedPath === path) {
        setRetryState(state);
      }
    });
    return unsubscribe;
  }, [path]);

  return retryState;
}
