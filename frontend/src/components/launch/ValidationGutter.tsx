/* ============================================================
   OmniLaunch — Validation Gutter
   ============================================================ */

"use client";

import { Check, AlertTriangle, X } from "lucide-react";
import type { RuleCheck } from "@/types";
import VoiceMatchMeter from "./VoiceMatchMeter";

interface ValidationGutterProps {
  checks: RuleCheck[];
  voiceMatchScore: number;
  aiIsmsRemoved: string[];
}

function StatusIcon({ status }: { status: string }) {
  if (status === "pass") {
    return <Check size={14} style={{ color: "var(--accent-teal)", flexShrink: 0 }} />;
  }
  if (status === "warning") {
    return <AlertTriangle size={14} style={{ color: "var(--accent-amber)", flexShrink: 0 }} />;
  }
  return <X size={14} style={{ color: "var(--accent-red)", flexShrink: 0 }} />;
}

export default function ValidationGutter({
  checks,
  voiceMatchScore,
  aiIsmsRemoved,
}: ValidationGutterProps) {
  const passed = checks.filter((c) => c.status === "pass").length;
  const total = checks.length;

  const allPassed = passed === total && total > 0;
  const hasFailures = checks.some((c) => c.status === "fail");
  const summaryColor = hasFailures
    ? "var(--accent-red)"
    : allPassed
    ? "var(--accent-teal)"
    : "var(--accent-amber)";

  return (
    <div
      style={{
        marginTop: "20px",
        borderTop: "1px solid var(--border-subtle)",
        paddingTop: "16px",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: "16px" }}
      >
        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>
          Validation
        </span>
        <span style={{ fontSize: "12px", fontWeight: 500, color: summaryColor }}>
          {passed}/{total} passed
        </span>
      </div>

      {/* Voice Match Meter */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
        <VoiceMatchMeter score={Math.round(voiceMatchScore * 100)} />
      </div>

      {/* Rule checks */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {checks.map((check, i) => (
          <div
            key={i}
            className="flex"
            style={{
              gap: "8px",
              padding: "8px 0",
              fontSize: "12px",
              alignItems: "flex-start",
              borderBottom:
                i < checks.length - 1 ? "1px solid var(--border-subtle)" : "none",
            }}
          >
            <div style={{ paddingTop: "1px", flexShrink: 0 }}>
              <StatusIcon status={check.status} />
            </div>
            <span style={{ color: "var(--text-secondary)", lineHeight: 1.4 }}>
              {check.detail}
            </span>
          </div>
        ))}
      </div>

      {/* AI-isms removed */}
      {aiIsmsRemoved.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              display: "block",
              marginBottom: "6px",
            }}
          >
            AI-isms removed
          </span>
          <div className="flex flex-wrap" style={{ gap: "4px" }}>
            {aiIsmsRemoved.map((item, i) => (
              <span
                key={i}
                style={{
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: "rgba(250, 82, 82, 0.08)",
                  color: "rgba(250, 82, 82, 0.8)",
                  fontSize: "11px",
                  border: "1px solid rgba(250, 82, 82, 0.15)",
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
