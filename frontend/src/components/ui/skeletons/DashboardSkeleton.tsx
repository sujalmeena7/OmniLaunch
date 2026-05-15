"use client";

import { Skeleton } from "@/components/ui/Skeleton";

/**
 * DashboardSkeleton — mimics the Dashboard page layout:
 * - Top row: 3 stat cards (LaunchOverviewCard, VoiceProfileCard, PlatformActivityCard)
 * - Bottom row: 3 stat cards (VoiceMatchCard, FeatureHighlightCard, PlatformBreakdownCard)
 * - Recent Launches section with LaunchRow items
 */
export function DashboardSkeleton() {
  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Stats Grid — top row (3 cards) */}
      <div
        className="grid grid-cols-1 md:grid-cols-3"
        style={{ gap: "20px", marginBottom: "20px" }}
      >
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Stats Grid — bottom row (3 cards) */}
      <div
        className="grid grid-cols-1 md:grid-cols-3"
        style={{ gap: "20px", marginBottom: "32px" }}
      >
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Recent Launches section */}
      <div
        style={{
          background: "var(--bg-card-glass)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--border-card)",
          borderRadius: "24px",
          padding: "32px",
        }}
      >
        {/* Section header */}
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: "16px" }}
        >
          <Skeleton width="140px" height="20px" borderRadius="6px" />
          <Skeleton width="80px" height="16px" borderRadius="6px" />
        </div>

        {/* LaunchRow skeletons */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <LaunchRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skeleton for a single stat card */
function StatCardSkeleton() {
  return (
    <div
      style={{
        background: "var(--bg-card-glass)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--border-card)",
        borderRadius: "24px",
        padding: "24px",
      }}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: "20px" }}
      >
        <Skeleton width="100px" height="12px" borderRadius="4px" />
        <Skeleton width="40px" height="18px" borderRadius="6px" />
      </div>

      {/* Main content area */}
      <div className="flex flex-col gap-3">
        <Skeleton width="60%" height="24px" borderRadius="6px" />
        <Skeleton width="80%" height="12px" borderRadius="4px" />
        <Skeleton width="100%" height="6px" borderRadius="3px" />
      </div>
    </div>
  );
}

/** Skeleton for a single LaunchRow */
function LaunchRowSkeleton() {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: "14px 16px",
        borderRadius: "12px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-center gap-3" style={{ flex: 1 }}>
        <Skeleton width="36px" height="36px" borderRadius="10px" />
        <div className="flex flex-col gap-1.5" style={{ flex: 1 }}>
          <Skeleton width="45%" height="14px" borderRadius="4px" />
          <Skeleton width="70%" height="11px" borderRadius="4px" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton width="60px" height="22px" borderRadius="12px" />
        <Skeleton width="50px" height="12px" borderRadius="4px" />
      </div>
    </div>
  );
}

export default DashboardSkeleton;
