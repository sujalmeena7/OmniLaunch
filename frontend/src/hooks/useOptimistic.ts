"use client";

import { useState, useCallback, useRef } from "react";

interface OptimisticState<T> {
  data: T;
  isPending: boolean;
  error: Error | null;
}

/**
 * Hook for optimistic UI updates.
 * Immediately applies the change to the UI, then confirms with the server.
 * If the server rejects, rolls back to the previous state.
 *
 * @param initialData - The current confirmed state
 * @param onMutate - Async function that performs the actual server mutation
 * @param onRollback - Optional callback when a rollback occurs
 */
export function useOptimistic<T>(
  initialData: T,
  onMutate: (optimisticData: T) => Promise<T>,
  onRollback?: (error: Error, previousData: T) => void
): [OptimisticState<T>, (updater: (current: T) => T) => Promise<void>] {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isPending: false,
    error: null,
  });
  const previousRef = useRef<T>(initialData);

  // Keep initialData in sync when it changes externally
  const lastInitialRef = useRef(initialData);
  if (initialData !== lastInitialRef.current && !state.isPending) {
    lastInitialRef.current = initialData;
    setState((s) => ({ ...s, data: initialData }));
  }

  const mutate = useCallback(
    async (updater: (current: T) => T) => {
      const previous = state.data;
      previousRef.current = previous;
      const optimistic = updater(previous);

      // Apply optimistically
      setState({ data: optimistic, isPending: true, error: null });

      try {
        // Confirm with server
        const confirmed = await onMutate(optimistic);
        setState({ data: confirmed, isPending: false, error: null });
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Mutation failed");
        // Rollback
        setState({ data: previousRef.current, isPending: false, error });
        onRollback?.(error, previousRef.current);
      }
    },
    [state.data, onMutate, onRollback]
  );

  return [state, mutate];
}

export default useOptimistic;
