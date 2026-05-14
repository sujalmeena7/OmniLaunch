"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface LaunchRowProps {
  id: string;
  productName: string;
  description: string;
  status: string;
  platformCount: number;
  relativeTime: string;
  index: number;
}

const STATUS_COLORS: Record<string, string> = {
  complete: "var(--accent-teal)",
  generating: "var(--accent-amber)",
  pending: "var(--text-muted)",
  failed: "var(--accent-red)",
};

export default function LaunchRow({
  id,
  productName,
  description,
  status,
  platformCount,
  relativeTime,
  index,
}: LaunchRowProps) {
  const router = useRouter();
  const dotColor = STATUS_COLORS[status] || "var(--text-muted)";

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03, ease: "easeOut" }}
      onClick={() => router.push(`/dashboard/bundles/${id}`)}
      className="flex items-center w-full text-left group"
      style={{
        height: "64px",
        padding: "0 12px",
        background: "transparent",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        border: "none",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        borderRadius: "16px",
        marginBottom: "4px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-surface-hover)";
        e.currentTarget.style.paddingLeft = "16px";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.paddingLeft = "12px";
      }}
    >
      {/* Status & Name */}
      <div className="flex items-center gap-4 flex-shrink-0" style={{ width: "240px" }}>
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: dotColor,
            boxShadow: `0 0 10px ${dotColor}44`,
          }}
        />
        <div className="flex flex-col">
          <span className="truncate" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>
            {productName}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>
            {status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Description */}
      <span
        className="truncate flex-1"
        style={{
          fontSize: "13px",
          color: "var(--text-muted)",
          padding: "0 24px",
        }}
      >
        {description || "No product description provided"}
      </span>

      {/* Platforms & Time */}
      <div className="flex items-center gap-6 flex-shrink-0">
        <div className="flex flex-col items-end">
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>{platformCount}</span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Channels</span>
        </div>
        <div style={{ width: "1px", height: "24px", background: "var(--border-subtle)" }} />
        <span style={{ fontSize: "12px", color: "var(--text-muted)", width: "70px", textAlign: "right" }}>
          {relativeTime}
        </span>
      </div>
    </motion.button>
  );
}
