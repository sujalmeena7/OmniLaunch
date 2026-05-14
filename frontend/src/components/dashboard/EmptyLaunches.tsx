"use client";

import { PackageOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function EmptyLaunches() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center relative py-20"
    >
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "24px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
          position: "relative",
          zIndex: 1,
          boxShadow: "var(--shadow-md)",
        }}
      >
        <PackageOpen size={32} style={{ color: "var(--text-secondary)" }} />
      </div>
      <h3
        style={{
          fontSize: "20px",
          fontWeight: 800,
          color: "var(--text-secondary)",
          fontFamily: "var(--font-heading)",
          letterSpacing: "-0.01em",
          margin: 0,
        }}
      >
        Your launchpad is empty
      </h3>
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-muted)",
          marginTop: "8px",
          textAlign: "center",
          maxWidth: "320px",
          lineHeight: 1.5,
        }}
      >
        Initialize your first OmniLaunch bundle to start generating platform-compliant content.
      </p>
      <button
        onClick={() => router.push("/dashboard/launch")}
        className="mt-8"
        style={{
          height: "44px",
          padding: "0 24px",
          borderRadius: "12px",
          background: "var(--accent-button-bg)",
          color: "var(--accent-button-text)",
          fontSize: "14px",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          boxShadow: "var(--accent-button-shadow)",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "var(--accent-button-shadow-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "var(--accent-button-shadow)";
        }}
      >
        Initialize First Launch
      </button>

      {/* Decorative Blur */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "300px", height: "300px", background: "var(--gradient-glow)", filter: "blur(60px)", pointerEvents: "none" }} />
    </motion.div>
  );
}
