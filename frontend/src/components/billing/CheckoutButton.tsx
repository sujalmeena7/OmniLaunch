"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";

/** Razorpay Checkout options interface */
interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill: { email: string };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

/** Lazy-loads the Razorpay checkout.js SDK */
function loadRazorpaySDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.head.appendChild(script);
  });
}

interface CheckoutButtonProps {
  planId: string;
  userEmail: string;
  onSuccess: () => void;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function CheckoutButton({
  planId,
  userEmail,
  onSuccess,
  children,
  className,
  disabled,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const handleCheckout = useCallback(async () => {
    if (loading || disabled) return;
    setLoading(true);

    try {
      // 1. Lazy-load Razorpay SDK
      await loadRazorpaySDK();

      // 2. Create subscription on backend
      const { subscription_id, razorpay_key_id } = await api.requestWithRetry<{
        subscription_id: string;
        razorpay_key_id: string;
      }>("/billing/create-subscription", {
        method: "POST",
        body: JSON.stringify({ plan: planId }),
      });

      // 3. Open Razorpay Checkout overlay
      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not available");
      }

      const razorpay = new window.Razorpay({
        key: razorpay_key_id,
        subscription_id,
        name: "OmniLaunch",
        description: `Subscribe to ${planId.replace("_", " ")} plan`,
        prefill: { email: userEmail },
        theme: { color: "#7c3aed" },
        handler: async (response: RazorpayResponse) => {
          try {
            // 4. Verify payment on backend
            await api.requestWithRetry("/billing/verify-payment", {
              method: "POST",
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            }, { isMutation: true });

            onSuccess();
          } catch {
            addToast({
              type: "error",
              message: "Payment verification failed. Please contact support.",
              duration: 5000,
            });
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            addToast({
              type: "warning",
              message: "Payment was not completed.",
              duration: 5000,
            });
          },
        },
      });

      razorpay.open();
    } catch (error) {
      setLoading(false);
      const message = error instanceof Error ? error.message : "Unable to load payment system. Please try again.";
      addToast({
        type: "error",
        message,
        duration: 5000,
      });
    }
  }, [planId, userEmail, onSuccess, loading, disabled, addToast]);

  return (
    <button
      onClick={handleCheckout}
      disabled={loading || disabled}
      className={
        className ||
        "w-full py-2.5 px-4 rounded-lg text-sm font-semibold bg-purple-500 hover:bg-purple-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      }
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Processing...
        </span>
      ) : (
        children || "Subscribe"
      )}
    </button>
  );
}
