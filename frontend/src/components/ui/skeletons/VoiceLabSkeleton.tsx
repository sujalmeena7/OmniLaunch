"use client";

import { Skeleton } from "@/components/ui/Skeleton";

/**
 * VoiceLabSkeleton — mimics the Voice Lab page layout:
 * - Page header with icon and title
 * - Two-column grid: training form (left) and voice profile cards (right)
 */
export function VoiceLabSkeleton() {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
      {/* Page header */}
      <div className="flex items-center" style={{ gap: "12px", marginBottom: "16px" }}>
        <Skeleton width="40px" height="40px" borderRadius="12px" />
        <div className="flex flex-col gap-1.5">
          <Skeleton width="120px" height="28px" borderRadius="8px" />
          <Skeleton width="280px" height="14px" borderRadius="4px" />
        </div>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "48px",
          marginTop: "40px",
        }}
      >
        {/* Left: Training form skeleton */}
        <div className="flex flex-col gap-4">
          {/* Profile name input */}
          <div>
            <Skeleton
              width="100px"
              height="12px"
              borderRadius="4px"
              style={{ marginBottom: "10px" }}
            />
            <Skeleton width="100%" height="44px" borderRadius="14px" />
          </div>

          {/* Training samples */}
          <div>
            <Skeleton
              width="120px"
              height="12px"
              borderRadius="4px"
              style={{ marginBottom: "10px" }}
            />
            <div className="flex flex-col gap-3">
              <Skeleton width="100%" height="80px" borderRadius="14px" />
              <Skeleton width="100%" height="80px" borderRadius="14px" />
            </div>
          </div>

          {/* Submit button */}
          <Skeleton width="100%" height="44px" borderRadius="12px" />
        </div>

        {/* Right: Voice profile cards skeleton */}
        <div>
          <Skeleton
            width="160px"
            height="12px"
            borderRadius="4px"
            style={{ marginBottom: "20px" }}
          />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <VoiceProfileCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Skeleton for a single voice profile card */
function VoiceProfileCardSkeleton() {
  return (
    <div
      style={{
        padding: "24px",
        borderRadius: "24px",
        background: "rgba(255, 255, 255, 0.4)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Header row */}
      <div
        className="flex items-start justify-between"
        style={{ marginBottom: "16px" }}
      >
        <div className="flex flex-col gap-1.5">
          <Skeleton width="130px" height="16px" borderRadius="4px" />
          <Skeleton width="180px" height="12px" borderRadius="4px" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <Skeleton width="70px" height="11px" borderRadius="4px" />
            <Skeleton width="40px" height="14px" borderRadius="4px" />
          </div>
          <Skeleton width="32px" height="32px" borderRadius="10px" />
        </div>
      </div>
    </div>
  );
}

export default VoiceLabSkeleton;
