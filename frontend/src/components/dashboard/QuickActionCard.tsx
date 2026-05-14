"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accentColor: string;
  delay?: number;
}

export default function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  accentColor,
  delay = 0,
}: QuickActionCardProps) {
  const router = useRouter();

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay, ease: "easeOut" }}
      onClick={() => router.push(href)}
      className="flex flex-col items-start text-left relative overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "8px",
        padding: "16px",
        backdropFilter: "blur(8px)",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        transition: "background 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-surface-hover)";
        e.currentTarget.style.borderColor = "var(--border-default)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg-surface)";
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Left accent line */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "2px",
          background: accentColor,
        }}
      />

      <Icon size={18} style={{ color: accentColor, marginLeft: "4px", background: "transparent" }} />

      <span
        style={{
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--text-secondary)",
          marginTop: "12px",
          marginLeft: "4px",
        }}
      >
        {title}
      </span>

      <span
        style={{
          fontSize: "12px",
          color: "var(--text-primary)",
          marginTop: "2px",
          lineHeight: 1.5,
          marginLeft: "4px",
        }}
      >
        {description}
      </span>
    </motion.button>
  );
}
