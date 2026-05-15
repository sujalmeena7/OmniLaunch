"use client";

import { Skeleton } from "@/components/ui/Skeleton";

/**
 * LaunchSkeleton — mimics the Launch workspace layout:
 * - Left panel: Product form with inputs
 * - Right panel: Platform tabs area with post preview placeholder
 */
export function LaunchSkeleton() {
  return (
    <div className="flex" style={{ height: "calc(100vh - 100px)" }}>
      {/* Left Panel — Product Form skeleton */}
      <div
        className="flex-shrink-0"
        style={{
          width: "380px",
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-subtle)",
          padding: "24px",
        }}
      >
        <div className="flex flex-col gap-5">
          {/* Form title */}
          <Skeleton width="140px" height="20px" borderRadius="6px" />

          {/* Voice profile selector */}
          <div>
            <Skeleton
              width="100px"
              height="12px"
              borderRadius="4px"
              style={{ marginBottom: "8px" }}
            />
            <Skeleton width="100%" height="44px" borderRadius="12px" />
          </div>

          {/* Product name */}
          <div>
            <Skeleton
              width="90px"
              height="12px"
              borderRadius="4px"
              style={{ marginBottom: "8px" }}
            />
            <Skeleton width="100%" height="44px" borderRadius="12px" />
          </div>

          {/* Description */}
          <div>
            <Skeleton
              width="80px"
              height="12px"
              borderRadius="4px"
              style={{ marginBottom: "8px" }}
            />
            <Skeleton width="100%" height="100px" borderRadius="12px" />
          </div>

          {/* Platform checkboxes */}
          <div>
            <Skeleton
              width="70px"
              height="12px"
              borderRadius="4px"
              style={{ marginBottom: "12px" }}
            />
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton width="18px" height="18px" borderRadius="4px" />
                  <Skeleton width={`${60 + i * 15}px`} height="14px" borderRadius="4px" />
                </div>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <Skeleton width="100%" height="44px" borderRadius="12px" />
        </div>
      </div>

      {/* Right Panel — Platform tabs and preview */}
      <div
        className="flex flex-col flex-1"
        style={{ background: "var(--bg-app)", overflow: "hidden" }}
      >
        {/* Platform tabs bar */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                width={`${70 + i * 10}px`}
                height="32px"
                borderRadius="8px"
              />
            ))}
          </div>
        </div>

        {/* Preview content area */}
        <div style={{ padding: "24px", flex: 1 }}>
          <div className="flex flex-col gap-4">
            <Skeleton width="200px" height="20px" borderRadius="6px" />
            <Skeleton width="100%" height="120px" borderRadius="12px" />
            <Skeleton width="100%" height="80px" borderRadius="12px" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LaunchSkeleton;
