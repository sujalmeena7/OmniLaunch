"use client";

import type { Subscription } from "@/types";

interface SubscriptionCardProps {
  subscription: Subscription;
  onChangePlan: () => void;
  onCancel: () => void;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  trialing: { label: "Trial", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  past_due: { label: "Past Due", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  canceled: { label: "Canceled", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export function SubscriptionCard({ subscription, onChangePlan, onCancel }: SubscriptionCardProps) {
  const { plan, status, current_period_end, launches_per_month, launches_used } = subscription;
  const statusInfo = STATUS_STYLES[status] || STATUS_STYLES.active;
  const quotaPercentage = launches_per_month > 0
    ? Math.min(100, Math.round((launches_used / launches_per_month) * 100))
    : 0;

  const formattedPeriodEnd = current_period_end
    ? new Date(current_period_end).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div 
      style={{
        background: "var(--bg-surface)",
        borderRadius: "32px",
        border: "1px solid var(--border-subtle)",
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        gap: "32px",
        boxShadow: "var(--shadow-md)",
        position: "relative",
        flexShrink: 0
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ fontSize: "24px", fontWeight: 900, color: "var(--text-secondary)", marginBottom: "8px", fontFamily: "var(--font-heading)" }}>
            {PLAN_LABELS[plan] || plan} Plan
          </h3>
          <div
            style={{
              display: "inline-flex",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "10px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-input-tint)",
              color: status === "active" ? "var(--accent-lime)" : "var(--text-secondary)"
            }}
          >
            {statusInfo.label}
          </div>
        </div>
        
        {plan !== "free" && status !== "canceled" && (
          <div style={{ display: "flex", gap: "20px" }}>
            <button
              onClick={onChangePlan}
              style={{ background: "none", border: "none", padding: 0, fontSize: "12px", fontWeight: 800, color: "var(--accent-lime)", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              Change
            </button>
            <button
              onClick={onCancel}
              style={{ background: "none", border: "none", padding: 0, fontSize: "12px", fontWeight: 800, color: "#ef4444", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Billing period details */}
      {plan !== "free" && (
        <div style={{ padding: "20px", borderRadius: "20px", background: "var(--bg-input-tint)", border: "1px solid var(--border-subtle)" }}>
          <p style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
            Next Billing Date
          </p>
          <p style={{ fontSize: "16px", color: "var(--text-secondary)", fontWeight: 700 }}>
            {formattedPeriodEnd}
          </p>
        </div>
      )}

      {/* Quota usage visualization */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Launch Quota Used</span>
          <span style={{ fontSize: "18px", fontWeight: 900, color: "var(--text-secondary)" }}>
            {launches_used} <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>/ {launches_per_month >= 999 ? "∞" : launches_per_month}</span>
          </span>
        </div>
        
        {launches_per_month < 999 && (
          <div style={{ width: "100%", height: "8px", background: "var(--bg-input-tint)", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{ 
                height: "100%", 
                borderRadius: "4px", 
                width: `${quotaPercentage}%`,
                background: quotaPercentage >= 90 
                  ? "#ef4444" 
                  : quotaPercentage >= 70 
                  ? "#f59e0b" 
                  : "var(--accent-button-bg)",
                transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: quotaPercentage < 70 ? "0 0 15px rgba(163, 230, 53, 0.3)" : "none"
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
