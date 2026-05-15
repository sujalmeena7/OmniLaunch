"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { api } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";
import { useRouter } from "next/navigation";

const PRICING_TIERS = [
  {
    id: "free",
    name: "FREE",
    price: "Free",
    interval: "",
    subtitle: "3 launches / month",
    features: [
      "3 launches per month",
      "All platforms supported",
      "Basic voice training",
    ],
    buttonText: "CURRENT",
    current: true,
  },
  {
    id: "pro",
    name: "PRO",
    badge: "MOST POPULAR",
    price: "₹499",
    interval: "/mo",
    subtitle: "50 launches / month",
    features: [
      "50 launches per month",
      "All platforms supported",
      "Advanced voice training",
      "Priority generation queue",
    ],
    buttonText: "PRO",
    popular: true,
  },
  {
    id: "team",
    name: "TEAM",
    price: "₹1,499",
    interval: "/mo",
    subtitle: "Unlimited launches",
    features: [
      "Unlimited launches",
      "All platforms supported",
      "Advanced voice training",
      "Priority generation queue",
    ],
    buttonText: "TEAM",
  }
];

export default function SubscriptionPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const addToast = useToastStore((state) => state.addToast);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (tierId: string) => {
    if (tierId === "free") return;
    
    setIsLoading(tierId);
    try {
      const planId = `${tierId}_${billingCycle}`;
      const response = await api.createSubscription(planId);
      
      // Load Razorpay SDK
      await new Promise<void>((resolve, reject) => {
        if ((window as any).Razorpay) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
        document.head.appendChild(script);
      });

      // Open Razorpay Checkout
      const razorpay = new (window as any).Razorpay({
        key: response.razorpay_key_id,
        subscription_id: response.subscription_id,
        name: "OmniLaunch",
        description: `Subscribe to ${tierId} ${billingCycle} plan`,
        prefill: { email: user?.email || "" },
        theme: { color: "#a3e635" },
        handler: async (paymentResponse: any) => {
          try {
            await api.requestWithRetry("/billing/verify-payment", {
              method: "POST",
              body: JSON.stringify({
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_subscription_id: paymentResponse.razorpay_subscription_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }),
            });
            addToast({
              type: "success",
              message: "Subscription activated successfully!",
              duration: 3000,
            });
            router.push("/dashboard/settings");
          } catch {
            addToast({
              type: "error",
              message: "Payment verification failed. Please contact support.",
              duration: 5000,
            });
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(null);
            addToast({
              type: "warning",
              message: "Payment was not completed.",
              duration: 3000,
            });
          },
        },
      });

      razorpay.open();
    } catch (error: any) {
      addToast({
        type: "error",
        message: error.message || "Failed to create subscription",
        duration: 5000,
      });
      setIsLoading(null);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto" style={{ background: "var(--bg-app)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "32px", paddingBottom: "60px" }}>
      
      {/* Header section */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 800, color: "var(--text-secondary)", letterSpacing: "-0.02em" }}>
          Choose Your Plan
        </h1>
        <button 
          onClick={() => router.back()}
          style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--bg-input-tint)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-subtle)", cursor: "pointer", color: "var(--text-muted)", transition: "all 0.2s" }} 
          className="hover:bg-[var(--border-subtle)]"
        >
          <X size={18} />
        </button>
      </div>

      {/* Monthly / Yearly Toggle */}
      <div style={{ display: "flex", background: "var(--bg-input-tint)", borderRadius: "32px", padding: "4px", marginBottom: "32px", alignItems: "center", border: "1px solid var(--border-subtle)" }}>
        <button 
          onClick={() => setBillingCycle("monthly")}
          style={{ 
            padding: "8px 24px", 
            borderRadius: "24px", 
            fontSize: "13px", 
            fontWeight: 800, 
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            border: "none", 
            cursor: "pointer", 
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", 
            background: billingCycle === "monthly" ? "var(--bg-elevated)" : "transparent", 
            color: billingCycle === "monthly" ? "var(--text-secondary)" : "var(--text-muted)", 
            boxShadow: billingCycle === "monthly" ? "var(--shadow-sm)" : "none" 
          }}
        >
          Monthly
        </button>
        <button 
          onClick={() => setBillingCycle("yearly")}
          style={{ 
            padding: "8px 24px", 
            borderRadius: "24px", 
            fontSize: "13px", 
            fontWeight: 800, 
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            border: "none", 
            cursor: "pointer", 
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", 
            background: billingCycle === "yearly" ? "var(--bg-elevated)" : "transparent", 
            color: billingCycle === "yearly" ? "var(--text-secondary)" : "var(--text-muted)", 
            boxShadow: billingCycle === "yearly" ? "var(--shadow-sm)" : "none" 
          }}
        >
          Yearly
        </button>
      </div>

      {/* Pricing Cards Container */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(3, 1fr)", 
        gap: "24px", 
        width: "100%", 
        maxWidth: "960px", 
        padding: "0 24px",
        alignItems: "stretch"
      }}>
        {PRICING_TIERS.map((tier) => (
          <div 
            key={tier.id}
            style={{ 
              background: "var(--bg-elevated)", 
              border: tier.popular ? "2px solid var(--accent-lime)" : "1px solid var(--border-subtle)", 
              borderRadius: "24px", 
              padding: "32px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              boxShadow: tier.popular ? "0 16px 40px -12px rgba(163, 230, 53, 0.25)" : "var(--shadow-md)",
              transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: tier.popular ? "scale(1.02) translateY(-8px)" : "translateY(0)"
            }}
            className={tier.popular ? "" : "hover:-translate-y-2"}
          >
            {/* Most Popular Badge */}
            {tier.badge && (
              <div 
                style={{ 
                  position: "absolute",
                  top: "-14px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--accent-lime)", 
                  color: "#0f172a", // Solid dark text for high contrast
                  padding: "6px 18px", 
                  borderRadius: "20px", 
                  fontSize: "11px", 
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  boxShadow: "0 4px 12px rgba(163, 230, 53, 0.4)",
                  whiteSpace: "nowrap"
                }}
              >
                {tier.badge}
              </div>
            )}

            <h3 style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "16px", textTransform: "uppercase" }}>
              {tier.name}
            </h3>

            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "16px", height: "40px" }}>
              <span style={{ fontSize: "40px", fontWeight: 800, color: "var(--text-secondary)", lineHeight: 1, letterSpacing: "-0.02em" }}>{tier.price}</span>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-muted)" }}>{tier.interval}</span>
            </div>

            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "24px", textAlign: "center" }}>
              {tier.subtitle}
            </div>

            <ul style={{ display: "flex", flexDirection: "column", gap: "12px", listStyle: "none", padding: 0, margin: 0, flex: 1, width: "100%", marginBottom: "32px" }}>
              {tier.features.map((feature, fIndex) => (
                <li key={fIndex} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>
                  <Check size={16} style={{ color: "var(--accent-lime)", flexShrink: 0 }} strokeWidth={3} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handleSubscribe(tier.id)}
              disabled={isLoading === tier.id || (tier.current && user?.plan === "free")}
              style={{ 
                width: "100%", 
                padding: "14px", 
                borderRadius: "16px", 
                border: tier.popular ? "none" : "1px solid var(--border-subtle)", 
                background: tier.popular ? "var(--accent-lime)" : "var(--bg-input-tint)", 
                color: tier.popular ? "#0f172a" : "var(--text-secondary)", 
                fontSize: "13px", 
                fontWeight: 800, 
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: (isLoading === tier.id || (tier.current && user?.plan === "free")) ? "not-allowed" : "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                opacity: isLoading === tier.id ? 0.7 : 1,
                boxShadow: tier.popular ? "0 8px 24px -4px rgba(163, 230, 53, 0.3)" : "none"
              }}
              className={tier.popular ? "hover:brightness-110 hover:shadow-[0_12px_32px_-4px_rgba(163,230,53,0.4)]" : "hover:bg-[var(--border-strong)]"}
            >
              {isLoading === tier.id ? "Loading..." : tier.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
