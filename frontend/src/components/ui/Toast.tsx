"use client";

/* ============================================================
   OmniLaunch — Toast Component
   ============================================================ */

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import type { Toast as ToastType } from "@/stores/toastStore";
import { useToastStore } from "@/stores/toastStore";

const variantStyles: Record<ToastType["type"], { bg: string; icon: React.ReactNode; border: string }> = {
  success: {
    bg: "bg-green-50 dark:bg-green-950/50",
    border: "border-green-200 dark:border-green-800",
    icon: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />,
  },
  error: {
    bg: "bg-red-50 dark:bg-red-950/50",
    border: "border-red-200 dark:border-red-800",
    icon: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />,
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800",
    icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />,
  },
};

interface ToastProps {
  toast: ToastType;
}

export function Toast({ toast }: ToastProps) {
  const removeToast = useToastStore((state) => state.removeToast);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast.id, toast.duration, removeToast]);

  const variant = variantStyles[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`pointer-events-auto flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg ${variant.bg} ${variant.border}`}
      role="alert"
      aria-live="assertive"
    >
      {variant.icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{toast.message}</p>
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
