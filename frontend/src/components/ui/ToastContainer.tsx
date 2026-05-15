"use client";

/* ============================================================
   OmniLaunch — Toast Container
   Renders all active toasts in a fixed top-right stack.
   ============================================================ */

import { AnimatePresence } from "framer-motion";
import { useToastStore } from "@/stores/toastStore";
import { Toast } from "./Toast";

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-3"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
