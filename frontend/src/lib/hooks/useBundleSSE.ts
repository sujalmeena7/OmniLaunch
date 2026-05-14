"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * SSE event shape emitted by the backend bundle status endpoint.
 */
export interface SSEEvent {
  platform: string;
  status:
    | "connected"
    | "researching"
    | "drafting"
    | "humanizing"
    | "complete"
    | "failed"
    | "stream_end";
  detail: string;
}

interface UseBundleSSEResult {
  events: SSEEvent[];
  isComplete: boolean;
  isFailed: boolean;
  error: string | null;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Hook that opens an EventSource connection to the bundle SSE endpoint
 * and streams generation progress events.
 *
 * @param bundleId - The bundle ID to subscribe to, or null to skip connection
 * @param token - The JWT auth token, or null to skip connection
 */
export function useBundleSSE(
  bundleId: string | null,
  token: string | null
): UseBundleSSEResult {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const closeConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Don't open a connection if bundleId or token is missing
    if (!bundleId || !token) {
      return;
    }

    // Reset state for a new connection
    setEvents([]);
    setIsComplete(false);
    setIsFailed(false);
    setError(null);

    const url = `${API_BASE}/bundles/${bundleId}/status?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event: MessageEvent) => {
      try {
        const parsed: SSEEvent = JSON.parse(event.data);

        setEvents((prev) => [...prev, parsed]);

        if (parsed.status === "complete" || parsed.status === "stream_end") {
          setIsComplete(true);
          closeConnection();
        } else if (parsed.status === "failed") {
          setIsFailed(true);
          setError(parsed.detail || "Generation failed");
          closeConnection();
        }
      } catch {
        // Ignore malformed JSON lines
      }
    };

    es.onerror = () => {
      setError("SSE connection error");
      closeConnection();
    };

    // Cleanup on unmount or when dependencies change
    return () => {
      closeConnection();
    };
  }, [bundleId, token, closeConnection]);

  return { events, isComplete, isFailed, error };
}
