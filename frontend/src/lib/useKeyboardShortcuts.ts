"use client";

import { useEffect, useRef } from "react";

/**
 * A global stack of escape handlers. The topmost (last) handler in the array
 * fires when the Escape key is pressed. Components push/pop their handler
 * on mount/unmount via the `useEscapeHandler` hook.
 */
const escapeHandlerStack: Array<() => void> = [];

/** Single global keydown listener — registered once, never removed. */
let listenerAttached = false;

function attachGlobalListener() {
  if (listenerAttached) return;
  listenerAttached = true;

  if (typeof document === "undefined") return;

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape" && escapeHandlerStack.length > 0) {
      e.preventDefault();
      // Fire the topmost handler (last in the stack)
      const topHandler = escapeHandlerStack[escapeHandlerStack.length - 1];
      topHandler();
    }
  });
}

/**
 * Registers an escape key handler on a global stack. When multiple overlays
 * are open simultaneously, only the topmost (most recently registered) handler
 * fires on Escape press.
 *
 * @param handler - The function to call when Escape is pressed and this is the topmost handler.
 * @param active - Whether this handler should be active. When false, the handler is not registered.
 */
export function useEscapeHandler(handler: () => void, active: boolean): void {
  const handlerRef = useRef(handler);

  // Keep the ref up to date so the stack always calls the latest handler
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!active) return;

    attachGlobalListener();

    // Create a stable wrapper that delegates to the current handler ref
    const stableHandler = () => handlerRef.current();

    escapeHandlerStack.push(stableHandler);

    return () => {
      const index = escapeHandlerStack.indexOf(stableHandler);
      if (index !== -1) {
        escapeHandlerStack.splice(index, 1);
      }
    };
  }, [active]);
}

/**
 * Utility to get the current stack size (useful for testing).
 */
export function getEscapeHandlerStackSize(): number {
  return escapeHandlerStack.length;
}

/**
 * Utility to reset the stack (useful for testing).
 */
export function resetEscapeHandlerStack(): void {
  escapeHandlerStack.length = 0;
}
