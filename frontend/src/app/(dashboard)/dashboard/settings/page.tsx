"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/stores/appStore";
import { useToastStore } from "@/stores/toastStore";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { SubscriptionCard } from "@/components/billing/SubscriptionCard";
import { BillingHistory } from "@/components/billing/BillingHistory";
import { TrialBanner } from "@/components/billing/TrialBanner";
import type { Subscription, BillingEvent } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, setUser } = useAppStore();
  const addToast = useToastStore((s) => s.addToast);

  // Billing state
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([]);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Fetch subscription details
  const fetchSubscription = useCallback(async () => {
    try {
      setLoadingSubscription(true);
      const data = await api.requestWithRetry<Subscription>("/billing/subscription");
      setSubscription(data);
    } catch {
      // Toast is handled by the API client
    } finally {
      setLoadingSubscription(false);
    }
  }, []);

  // Fetch billing history
  const fetchBillingHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const data = await api.requestWithRetry<{ events: BillingEvent[] }>("/billing/history");
      setBillingEvents(data.events);
    } catch {
      // Toast is handled by the API client
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
    fetchBillingHistory();
  }, [fetchSubscription, fetchBillingHistory]);

  const handleLogout = () => {
    logout();
    api.clearToken();
    router.push("/login");
  };

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      await api.requestWithRetry("/billing/cancel", {
        method: "POST",
      }, { isMutation: true });
      setShowCancelDialog(false);
      await fetchSubscription();
      try {
        const userData = await api.getMe();
        setUser(userData as unknown as import("@/types").UserProfile);
      } catch {
        // Silently fail
      }
    } catch {
      // Toast is handled by the API client
    } finally {
      setCancelLoading(false);
    }
  };

  // Handle upgrade from trial banner
  const handleUpgradeFromBanner = () => {
    router.push("/dashboard/subscription");
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 20px 100px 20px", display: "flex", flexDirection: "column" }}>
      {/* 1. Page Header Section */}
      <div style={{ marginBottom: "48px", position: "relative", zIndex: 1 }}>
        <h1 
          style={{ 
            fontSize: "36px", 
            fontWeight: 900, 
            color: "var(--text-secondary)", 
            marginBottom: "12px", 
            fontFamily: "var(--font-heading)",
            lineHeight: 1.2
          }}
        >
          Account Settings
        </h1>
        <p style={{ fontSize: "18px", color: "var(--text-muted)", fontWeight: 500, maxWidth: "600px" }}>
          Manage your premium features, billing history, and profile preferences.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "32px", position: "relative", zIndex: 2 }}>
        {/* 2. Trial Banner (if active) */}
        {user?.is_trial && (
          <div style={{ flexShrink: 0 }}>
            <TrialBanner
              trialEndsAt={user.trial_ends_at}
              onUpgrade={handleUpgradeFromBanner}
            />
          </div>
        )}

        {/* 3. Profile Card */}
        <div
          style={{
            background: "var(--bg-surface)",
            borderRadius: "32px",
            border: "1px solid var(--border-subtle)",
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            gap: "32px",
            flexShrink: 0,
            boxShadow: "var(--shadow-lg)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "6px", height: "20px", background: "var(--accent-lime)", borderRadius: "3px" }} />
            <h2 style={{ fontSize: "12px", fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
              Your Profile
            </h2>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "20px", gap: "8px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Display Name</span>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-secondary)" }}>{user?.display_name || "—"}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "20px", gap: "8px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Email Address</span>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-secondary)", wordBreak: "break-all" }}>{user?.email || "—"}</span>
            </div>
          </div>
        </div>

        {/* 4. Subscription & Billing Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", flexShrink: 0 }}>
          {loadingSubscription ? (
            <div style={{ padding: "60px", background: "var(--bg-input-tint)", borderRadius: "32px", display: "flex", justifyContent: "center" }}>
               <div className="w-8 h-8 border-4 border-[var(--accent-lime)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : subscription ? (
            <SubscriptionCard
              subscription={subscription}
              onChangePlan={() => router.push("/dashboard/subscription")}
              onCancel={() => setShowCancelDialog(true)}
            />
          ) : (
            <div style={{ padding: "40px", background: "var(--bg-surface)", borderRadius: "32px", border: "1px solid var(--border-subtle)" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-secondary)", marginBottom: "16px" }}>
                {user?.plan?.toUpperCase()} PLAN
              </h3>
              <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontWeight: 500 }}>
                You are currently on the {user?.plan} tier with {user?.launches_remaining ?? 0} / {user?.launches_per_month ?? 3} launches available.
              </p>
              {user?.plan === "free" && (
                <button
                  onClick={() => router.push("/dashboard/subscription")}
                  style={{ 
                    padding: "16px 40px", 
                    borderRadius: "16px", 
                    background: "var(--accent-lime)", 
                    color: "#0f172a",
                    fontSize: "14px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Upgrade Now
                </button>
              )}
            </div>
          )}

          {/* 5. Action Buttons & Overlays */}
          {showCancelDialog && (
            <div style={{ padding: "40px", background: "rgba(250, 82, 82, 0.05)", borderRadius: "32px", border: "1px solid rgba(250, 82, 82, 0.5)" }}>
              <h3 style={{ fontSize: "24px", fontWeight: 900, color: "var(--text-secondary)", marginBottom: "16px" }}>Cancel Subscription?</h3>
              <p style={{ color: "var(--text-muted)", marginBottom: "40px", lineHeight: 1.6 }}>
                Are you sure? Your benefits will continue until <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>{subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "the end of your billing period"}</span>.
              </p>
              <div style={{ display: "flex", gap: "16px" }}>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                  style={{ padding: "16px 40px", borderRadius: "16px", background: "#ef4444", color: "white", fontWeight: 900, textTransform: "uppercase", border: "none", cursor: "pointer", opacity: cancelLoading ? 0.5 : 1 }}
                >
                  {cancelLoading ? "Processing..." : "Yes, Cancel"}
                </button>
                <button
                  onClick={() => setShowCancelDialog(false)}
                  style={{ padding: "16px 40px", borderRadius: "16px", background: "var(--bg-input-tint)", color: "var(--text-secondary)", fontWeight: 700, border: "none", cursor: "pointer" }}
                >
                  Keep My Plan
                </button>
              </div>
            </div>
          )}

          {/* 6. History & Danger Zone */}
          <BillingHistory events={billingEvents} loading={loadingHistory} />

          <div 
            style={{ 
              padding: "40px", 
              borderRadius: "32px", 
              background: "rgba(250, 82, 82, 0.03)", 
              border: "1px solid rgba(250, 82, 82, 0.1)",
              marginBottom: "100px"
            }}
          >
            <h2 style={{ fontSize: "12px", fontWeight: 900, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "24px" }}>Danger Zone</h2>
            <button
              onClick={handleLogout}
              style={{ 
                padding: "16px 40px", 
                borderRadius: "16px", 
                background: "rgba(250, 82, 82, 0.05)", 
                color: "#ef4444", 
                fontWeight: 900, 
                textTransform: "uppercase", 
                letterSpacing: "0.1em",
                border: "1px solid rgba(250, 82, 82, 0.2)",
                cursor: "pointer"
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
