"use client";

import { Skeleton } from "@/components/ui/Skeleton";

/**
 * BundlesSkeleton — mimics the Bundles list page layout:
 * - Page title and description
 * - List of bundle cards with product name, description, date, and status badge
 */
export function BundlesSkeleton() {
  return (
    <div style={{ maxWidth: "800px" }}>
      {/* Page header */}
      <Skeleton
        width="200px"
        height="28px"
        borderRadius="8px"
        style={{ marginBottom: "8px" }}
      />
      <Skeleton
        width="320px"
        height="14px"
        borderRadius="4px"
        style={{ marginBottom: "24px" }}
      />

      {/* Bundle card list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <BundleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for a single bundle card */
function BundleCardSkeleton() {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: "20px 24px",
        borderRadius: "var(--radius-lg)",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex flex-col gap-2" style={{ flex: 1 }}>
        <Skeleton width="55%" height="15px" borderRadius="4px" />
        <Skeleton width="80%" height="13px" borderRadius="4px" />
        <Skeleton width="35%" height="12px" borderRadius="4px" />
      </div>
      <Skeleton
        width="70px"
        height="24px"
        borderRadius="var(--radius-full)"
      />
    </div>
  );
}

export default BundlesSkeleton;
