"use client";

import { Rocket } from "lucide-react";

export default function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ height: "100%", position: "relative" }}
    >
      <div
        style={{
          position: "absolute",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(212, 245, 66, 0.03) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "20px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            marginBottom: "20px",
            boxShadow: "0 8px 16px -4px rgba(0,0,0,0.04)",
          }}
        >
          <Rocket size={32} style={{ color: "var(--accent-lime)" }} />
        </div>
        <span
          style={{
            fontSize: "20px",
            fontWeight: 800,
            color: "var(--text-secondary)",
            fontFamily: "var(--font-heading)",
            letterSpacing: "-0.02em",
          }}
        >
          Ready to launch
        </span>
        <span
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            marginTop: "8px",
            maxWidth: "240px",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Fill in your product details on the left and prepare for take-off.
        </span>
      </div>
    </div>
  );
}
