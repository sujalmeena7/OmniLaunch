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
    <div className="px-3 py-1.5">
      <div
        className="rounded-xl p-3.5 transition-all duration-300"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: `1px solid ${isExhausted ? "rgba(239, 68, 68, 0.2)" : showWarning ? "rgba(245, 158, 11, 0.2)" : "rgba(255, 255, 255, 0.05)"}`,
        }}
      >
        {/* Plan name + Upgrade */}
        <div className="flex items-center justify-between mb-2.5">
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {plan.toUpperCase()} PLAN
          </span>
          {plan === "free" && (
            <a
              href="/dashboard/settings"
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--accent-lime)",
                textDecoration: "none",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Upgrade
            </a>
          )}
          {isInTrial && (
            <span style={{ fontSize: "9px", color: "var(--accent-lime)", fontWeight: 800, textTransform: "uppercase", background: "rgba(163, 230, 53, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
              Trial
            </span>
          )}
        </div>

        {/* Launches count */}
        <div className="mb-2.5">
          <span
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: isExhausted ? "#ef4444" : "var(--text-secondary)",
              letterSpacing: "-0.01em",
            }}
          >
            {launchesUsed} / {plan === "team" ? "∞" : launchesPerMonth}
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, marginLeft: "6px" }}>
            Launches
          </span>
        </div>

        {/* Progress bar */}
        {plan !== "team" && (
          <div
            className="w-full rounded-full overflow-hidden"
            style={{
              height: "5px",
              background: "rgba(255, 255, 255, 0.06)",
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPercent}%`,
                background: isExhausted
                  ? "#ef4444"
                  : showWarning
                    ? "#f59e0b"
                    : "var(--accent-lime)",
                boxShadow: isExhausted ? "none" : "0 0 6px rgba(163, 230, 53, 0.3)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
