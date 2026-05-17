"use client";

import { useEffect, useState } from "react";
import { Zap, AlertTriangle, ArrowUpRight, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";
import type { Subscription } from "@/types";

/**
 * Calculates the number of days remaining in a trial period.
 * Returns the ceiling of the difference between trial_ends_at and now, in days.
 */
export function calculateTrialDaysRemaining(trialEndsAt: string | null, now: Date = new Date()): number | null {
  if (!trialEndsAt) return null;
  const endDate = new Date(trialEndsAt);
  if (isNaN(endDate.getTime())) return null;
  const diffMs = endDate.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determines whether a quota warning should be displayed based on plan and remaining quota.
 * - Free plan: warn when quota ≤ 1
 * - Pro plan: warn when quota ≤ 5
 * - Team plan: never warn
 */
export function shouldShowQuotaWarning(plan: "free" | "pro" | "team", launchesRemaining: number): boolean {
  if (plan === "team") return false;
  if (plan === "free") return launchesRemaining <= 1;
  if (plan === "pro") return launchesRemaining <= 5;
  return false;
}

export default function QuotaDisplay() {
  const { user } = useAppStore();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .requestWithRetry<Subscription>("/billing/subscription")
      .then((data) => setSubscription(data))
      .catch(() => {
        // If subscription fetch fails, we'll use profile data as fallback
        setSubscription(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-3">
        <div className="h-16 rounded-xl animate-pulse" style={{ background: "var(--bg-elevated)" }} />
      </div>
    );
  }

  // Use subscription data if available, otherwise fall back to user profile
  const plan = subscription?.plan ?? user?.plan ?? "free";
  const launchesPerMonth = subscription?.launches_per_month ?? user?.launches_per_month ?? 3;
  const launchesRemaining = user?.launches_remaining ?? 0;
  const launchesUsed = Math.max(0, launchesPerMonth - launchesRemaining);

  const isExhausted = launchesRemaining <= 0;
  const showWarning = shouldShowQuotaWarning(plan, launchesRemaining);
  const progressPercent = launchesPerMonth > 0 ? Math.min(100, (launchesUsed / launchesPerMonth) * 100) : 0;

  // Trial info
  const trialDaysLeft = user?.is_trial ? calculateTrialDaysRemaining(user.trial_ends_at) : null;
  const isInTrial = trialDaysLeft !== null && trialDaysLeft > 0;

  return (
    <div style={{ padding: "12px 14px 20px" }}>
      <div
        style={{
          borderRadius: "16px",
          padding: "20px 18px",
          background: "var(--bg-card-glass, rgba(255, 255, 255, 0.95))",
          border: isExhausted 
            ? "1px solid rgba(239, 68, 68, 0.3)" 
            : "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.08))",
        }}
      >
        {/* Plan badge + Upgrade */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ 
              width: "6px", 
              height: "6px", 
              borderRadius: "50%", 
              background: isExhausted ? "#ef4444" : "var(--accent-lime)",
              boxShadow: isExhausted ? "0 0 6px #ef4444" : "0 0 6px var(--accent-lime)",
            }} />
            <span style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}>
              {plan.toUpperCase()} PLAN
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
            {plan === "free" && (
              <a
                href="/dashboard/subscription"
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "var(--accent-lime)",
                  textDecoration: "none",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(163, 230, 53, 0.08)",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                Upgrade
              </a>
            )}
            {isInTrial && (
              <span style={{ 
                fontSize: "9px", 
                color: "var(--accent-lime)", 
                fontWeight: 800, 
                textTransform: "uppercase", 
                background: "rgba(163, 230, 53, 0.1)", 
                padding: "4px 10px", 
                borderRadius: "6px",
                letterSpacing: "0.05em",
                whiteSpace: "nowrap",
              }}>
                Trial · {trialDaysLeft}d
              </span>
            )}
          </div>
        </div>

        {/* Launches count */}
        <div style={{ marginBottom: "14px" }}>
          <span style={{
            fontSize: "22px",
            fontWeight: 800,
            color: isExhausted ? "#ef4444" : "var(--text-secondary)",
            letterSpacing: "-0.02em",
            fontFamily: "var(--font-heading)",
          }}>
            {launchesRemaining}
          </span>
          <span style={{ 
            fontSize: "13px", 
            color: "var(--text-muted)", 
            fontWeight: 500, 
            marginLeft: "4px" 
          }}>
            / {plan === "team" ? "∞" : launchesPerMonth}
          </span>
          <div style={{ 
            fontSize: "11px", 
            color: "var(--text-muted)", 
            fontWeight: 500, 
            marginTop: "2px" 
          }}>
            launches remaining
          </div>
        </div>

        {/* Progress bar */}
        {plan !== "team" && (
          <div
            style={{
              width: "100%",
              height: "6px",
              borderRadius: "3px",
              background: "var(--bg-surface-hover, rgba(0, 0, 0, 0.06))",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                borderRadius: "3px",
                background: isExhausted
                  ? "#ef4444"
                  : showWarning
                    ? "#f59e0b"
                    : "#65a30d",
                boxShadow: isExhausted 
                  ? "0 0 8px rgba(239, 68, 68, 0.4)" 
                  : "0 0 6px rgba(101, 163, 13, 0.4)",
                transition: "width 0.7s ease-out",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
