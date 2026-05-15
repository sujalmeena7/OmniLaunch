"use client";

import type { BillingEvent } from "@/types";

interface BillingHistoryProps {
  events: BillingEvent[];
  loading?: boolean;
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  captured: { label: "Paid", className: "text-green-400" },
  authorized: { label: "Authorized", className: "text-blue-400" },
  failed: { label: "Failed", className: "text-red-400" },
  refunded: { label: "Refunded", className: "text-amber-400" },
};

/** Formats paise amount to INR display string */
function formatINR(amountPaise: number): string {
  const rupees = amountPaise / 100;
  return `₹${rupees.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** Maps event_type to a human-readable plan name */
function getPlanLabel(event: BillingEvent): string {
  if (event.plan) return event.plan;
  if (event.event_type.includes("pro")) return "Pro";
  if (event.event_type.includes("team")) return "Team";
  return "Subscription";
}

export function BillingHistory({ events, loading }: BillingHistoryProps) {
  if (loading) {
    return (
      <div 
        style={{
          background: "var(--bg-surface)",
          borderRadius: "32px",
          border: "1px solid var(--border-subtle)",
          padding: "40px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxShadow: "var(--shadow-md)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "6px", height: "20px", background: "var(--accent-lime)", borderRadius: "3px" }} />
          <h3 style={{ fontSize: "12px", fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
            Billing History
          </h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: "48px", background: "var(--bg-input-tint)", borderRadius: "12px" }} className="animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div 
        style={{
          background: "var(--bg-surface)",
          borderRadius: "32px",
          border: "1px solid var(--border-subtle)",
          padding: "40px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxShadow: "var(--shadow-md)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "6px", height: "20px", background: "var(--accent-lime)", borderRadius: "3px" }} />
          <h3 style={{ fontSize: "12px", fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
            Billing History
          </h3>
        </div>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500, paddingLeft: "18px" }}>
          No payments have been made yet. Subscribe to a paid plan to see your billing history here.
        </p>
      </div>
    );
  }

  return (
    <div 
      style={{
        background: "var(--bg-surface)",
        borderRadius: "32px",
        border: "1px solid var(--border-subtle)",
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        boxShadow: "var(--shadow-md)",
        flexShrink: 0
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "6px", height: "20px", background: "var(--accent-lime)", borderRadius: "3px" }} />
        <h3 style={{ fontSize: "12px", fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
          Billing History
        </h3>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <th style={{ textAlign: "left", padding: "12px", fontSize: "10px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Date</th>
              <th style={{ textAlign: "left", padding: "12px", fontSize: "10px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Amount</th>
              <th style={{ textAlign: "left", padding: "12px", fontSize: "10px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Plan</th>
              <th style={{ textAlign: "left", padding: "12px", fontSize: "10px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Status</th>
              <th style={{ textAlign: "right", padding: "12px", fontSize: "10px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const statusInfo = STATUS_STYLES[event.status] || {
                label: event.status,
                className: "text-gray-400",
              };
              const date = new Date(event.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <tr key={event.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "16px 12px", fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>{date}</td>
                  <td style={{ padding: "16px 12px", fontSize: "14px", color: "var(--text-secondary)", fontWeight: 700 }}>
                    {formatINR(event.amount_paise)}
                  </td>
                  <td style={{ padding: "16px 12px", fontSize: "14px", color: "var(--text-secondary)", fontWeight: 600 }}>{getPlanLabel(event)}</td>
                  <td style={{ padding: "16px 12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: event.status === "captured" ? "var(--accent-lime)" : "#94a3b8" }}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td style={{ padding: "16px 12px", textAlign: "right" }}>
                    {event.receipt_url ? (
                      <a
                        href={event.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "12px", fontWeight: 800, color: "var(--accent-lime)", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.05em" }}
                      >
                        Receipt
                      </a>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
