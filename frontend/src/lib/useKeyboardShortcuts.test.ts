import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useEscapeHandler,
  getEscapeHandlerStackSize,
  resetEscapeHandlerStack,
} from "./useKeyboardShortcuts";

function fireEscape() {
  const event = new KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
}

describe("useEscapeHandler", () => {
  beforeEach(() => {
    resetEscapeHandlerStack();
  });

  it("calls the handler when Escape is pressed and active is true", () => {
    const handler = vi.fn();
    renderHook(() => useEscapeHandler(handler, true));

    act(() => fireEscape());

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not call the handler when active is false", () => {
    const handler = vi.fn();
    renderHook(() => useEscapeHandler(handler, false));

    act(() => fireEscape());

    expect(handler).not.toHaveBeenCalled();
  });

  it("only calls the topmost handler when multiple are registered", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const handler3 = vi.fn();

    renderHook(() => useEscapeHandler(handler1, true));
    renderHook(() => useEscapeHandler(handler2, true));
    renderHook(() => useEscapeHandler(handler3, true));

    act(() => fireEscape());

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
    expect(handler3).toHaveBeenCalledTimes(1);
  });

  it("removes handler from stack on unmount", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    renderHook(() => useEscapeHandler(handler1, true));
    const { unmount } = renderHook(() => useEscapeHandler(handler2, true));

    // handler2 is topmost
    expect(getEscapeHandlerStackSize()).toBe(2);

    unmount();

    // After unmount, handler1 is now topmost
    expect(getEscapeHandlerStackSize()).toBe(1);

    act(() => fireEscape());

    expect(handler2).not.toHaveBeenCalled();
    expect(handler1).toHaveBeenCalledTimes(1);
  });

  it("removes handler from stack when active changes to false", () => {
    const handler = vi.fn();
    const { rerender } = renderHook(
      ({ active }) => useEscapeHandler(handler, active),
      { initialProps: { active: true } }
    );

    expect(getEscapeHandlerStackSize()).toBe(1);

    rerender({ active: false });

    expect(getEscapeHandlerStackSize()).toBe(0);

    act(() => fireEscape());

    expect(handler).not.toHaveBeenCalled();
  });

  it("adds handler to stack when active changes to true", () => {
    const handler = vi.fn();
    const { rerender } = renderHook(
      ({ active }) => useEscapeHandler(handler, active),
      { initialProps: { active: false } }
    );

    expect(getEscapeHandlerStackSize()).toBe(0);

    rerender({ active: true });

    expect(getEscapeHandlerStackSize()).toBe(1);

    act(() => fireEscape());

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("uses the latest handler reference", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { rerender } = renderHook(
      ({ handler }) => useEscapeHandler(handler, true),
      { initialProps: { handler: handler1 } }
    );

    rerender({ handler: handler2 });

    act(() => fireEscape());

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledTimes(1);
  });
});
