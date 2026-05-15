"use client";

import { useMemo } from "react";

interface TrialBannerProps {
  trialEndsAt: string | null;
  onUpgrade: () => void;
}

/** Calculates the number of days remaining in the trial */
export function getTrialDaysRemaining(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const endDate = new Date(trialEndsAt);
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function TrialBanner({ trialEndsAt, onUpgrade }: TrialBannerProps) {
  const daysRemaining = useMemo(() => getTrialDaysRemaining(trialEndsAt), [trialEndsAt]);

  // Only show banner when trial has fewer than 3 days remaining
  if (daysRemaining === null || daysRemaining >= 3) return null;

  const isExpired = daysRemaining <= 0;

  return (
    <div
      className={`w-full rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isExpired
          ? "border-red-500/30 bg-red-500/5"
          : "border-amber-500/30 bg-amber-500/5"
      }`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">
          {isExpired ? "⚠️" : "⏰"}
        </span>
        <div>
          <p className={`text-sm font-semibold ${isExpired ? "text-red-400" : "text-amber-400"}`}>
            {isExpired
              ? "Your trial has expired"
              : daysRemaining === 1
              ? "Your trial expires tomorrow"
              : `Your trial expires in ${daysRemaining} days`}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {isExpired
              ? "You've been downgraded to the Free plan (3 launches/month). Upgrade to keep your full access."
              : "Upgrade now to keep your Pro features and avoid losing access."}
          </p>
        </div>
      </div>
      <button
        onClick={onUpgrade}
        className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold bg-purple-500 hover:bg-purple-600 text-white transition-colors"
      >
        Upgrade Now
      </button>
    </div>
  );
}
