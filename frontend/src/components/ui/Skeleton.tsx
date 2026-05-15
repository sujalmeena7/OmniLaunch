"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}

/**
 * Base Skeleton component with shimmer animation.
 * Uses Tailwind `animate-pulse` combined with a custom shimmer gradient
 * for a polished loading placeholder effect.
 */
export function Skeleton({
  className = "",
  width,
  height,
  borderRadius = "8px",
  style,
}: SkeletonProps) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        width: width ?? "100%",
        height: height ?? "16px",
        borderRadius,
        background:
          "linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-tertiary) 50%, var(--bg-surface-hover) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite, pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        ...style,
      }}
    />
  );
}

/**
 * Skeleton shaped like a circle (for avatars, icons, etc.)
 */
export function SkeletonCircle({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius="50%"
      className={className}
    />
  );
}

/**
 * Skeleton shaped like a text line with variable width.
 */
export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="12px"
          width={i === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}

export default Skeleton;
