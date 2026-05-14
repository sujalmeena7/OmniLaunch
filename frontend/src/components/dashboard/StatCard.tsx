"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useCountUp } from "@/hooks/useCountUp";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  delay?: number;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  delay = 0,
}: StatCardProps) {
  const animatedValue = useCountUp(value, 600);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay, ease: "easeOut" }}
      className="flex flex-col justify-between"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "8px",
        padding: "16px",
        backdropFilter: "blur(8px)",
        transition: "border-color 0.2s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-default)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
      }}
    >
      <div className="flex items-start justify-between">
        <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>{label}</span>
        <Icon size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
      </div>
      <span style={{ fontSize: "22px", fontWeight: 500, color: "var(--text-secondary)", marginTop: "12px" }}>
        {animatedValue.toLocaleString()}
      </span>
    </motion.div>
  );
}
