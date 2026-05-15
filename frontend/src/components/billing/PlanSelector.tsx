"use client";

import { useState } from "react";

export interface PlanOption {
  id: string;
  name: string;
  price: number; // monthly price in INR
  yearlyPrice: number; // yearly price in INR
  launchesPerMonth: number | "Unlimited";
  features: string[];
  highlighted?: boolean;
}

const PLANS: PlanOption[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    yearlyPrice: 0,
    launchesPerMonth: 3,
    features: [
      "3 launches per month",
      "All platforms supported",
      "Basic voice training",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 499,
    yearlyPrice: 4999,
    launchesPerMonth: 50,
    highlighted: true,
    features: [
      "50 launches per month",
      "All platforms supported",
      "Advanced voice training",
      "Priority generation queue",
      "Email support",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: 1499,
    yearlyPrice: 14999,
    launchesPerMonth: "Unlimited",
    features: [
      "Unlimited launches",
      "All platforms supported",
      "Advanced voice training",
      "Priority generation queue",
      "Dedicated support",
      "Team collaboration",
    ],
  },
];

interface PlanSelectorProps {
  currentPlan: "free" | "pro" | "team";
  onSelectPlan: (planId: string, billing: "monthly" | "yearly") => void;
  loading?: boolean;
}

export function PlanSelector({ currentPlan, onSelectPlan, loading }: PlanSelectorProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="w-full">
      {/* Billing cycle toggle — Increased margin to prevent overlap with badges */}
      {/* Billing cycle toggle — Improved visibility and spacing */}
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          marginBottom: "64px", 
          gap: "16px" 
        }}
      >
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "20px", 
            background: "rgba(255,255,255,0.03)", 
            padding: "8px 24px", 
            borderRadius: "99px",
            border: "1px solid rgba(255,255,255,0.05)" 
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: billingCycle === "monthly" ? "white" : "rgba(255,255,255,0.4)",
              transition: "color 0.3s ease"
            }}
          >
            Monthly
          </span>
          
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            style={{
              position: "relative",
              width: "56px",
              height: "28px",
              borderRadius: "14px",
              background: billingCycle === "yearly" ? "var(--accent-lime)" : "rgba(255,255,255,0.1)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: billingCycle === "yearly" ? "0 0 15px rgba(163, 230, 53, 0.4)" : "none"
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "3px",
                left: "3px",
                width: "22px",
                height: "22px",
                borderRadius: "11px",
                background: "white",
                transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: billingCycle === "yearly" ? "translateX(28px)" : "translateX(0)"
              }}
            />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: billingCycle === "yearly" ? "white" : "rgba(255,255,255,0.4)",
                transition: "color 0.3s ease"
              }}
            >
              Yearly
            </span>
            {billingCycle === "yearly" && (
              <span style={{ fontSize: "9px", fontWeight: 900, color: "var(--accent-lime)", background: "rgba(163,230,53,0.1)", padding: "2px 8px", borderRadius: "4px" }}>
                -17%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan;
          const displayPrice = billingCycle === "monthly" ? plan.price : plan.yearlyPrice;
          const perMonth = billingCycle === "yearly" && plan.yearlyPrice > 0
            ? Math.round(plan.yearlyPrice / 12)
            : plan.price;

          return (
            <div
              key={plan.id}
              style={{
                position: "relative",
                borderRadius: "28px",
                border: plan.highlighted ? "2px solid var(--accent-lime)" : "1px solid var(--border-subtle)",
                background: plan.highlighted ? "rgba(163,230,53,0.02)" : "var(--bg-surface)",
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                transition: "all 0.3s ease",
                minHeight: "400px",
                backdropFilter: "blur(20px)",
                boxShadow: plan.highlighted ? "0 15px 30px -10px rgba(163,230,53,0.1)" : "var(--shadow-sm)"
              }}
            >
              {plan.highlighted && (
                <div 
                  style={{ 
                    position: "absolute",
                    top: "-12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--accent-button-bg)",
                    color: "var(--accent-button-text)",
                    fontSize: "9px",
                    fontWeight: 900,
                    padding: "4px 16px",
                    borderRadius: "99px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    boxShadow: "0 4px 10px rgba(163, 230, 53, 0.3)",
                    zIndex: 10
                  }}
                >
                  Most Popular
                </div>
              )}

              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
                {plan.name}
              </h3>

              <div style={{ marginBottom: "20px" }}>
                {displayPrice === 0 ? (
                  <h2 style={{ fontSize: "36px", fontWeight: 900, color: "white" }}>Free</h2>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
                      <span style={{ fontSize: "36px", fontWeight: 900, color: "white" }}>
                        ₹{perMonth.toLocaleString("en-IN")}
                      </span>
                      <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 700 }}>/mo</span>
                    </div>
                  </div>
                )}
              </div>

              <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, marginBottom: "20px" }}>
                {plan.launchesPerMonth === "Unlimited"
                  ? "Unlimited launches"
                  : `${plan.launchesPerMonth} launches / month`}
              </p>

              <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
                {plan.features.slice(0, 4).map((feature) => (
                  <div key={feature} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                    <span style={{ color: "var(--accent-lime)", fontSize: "10px" }}>✓</span>
                    {feature}
                  </div>
                ))}
              </div>

              <button
                onClick={() => onSelectPlan(plan.id, billingCycle)}
                disabled={isCurrentPlan || loading}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "16px",
                  fontSize: "13px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  border: isCurrentPlan ? "1px solid rgba(255,255,255,0.05)" : "none",
                  background: isCurrentPlan 
                    ? "rgba(255,255,255,0.03)" 
                    : plan.highlighted 
                    ? "var(--accent-button-bg)" 
                    : "rgba(255,255,255,0.08)",
                  color: isCurrentPlan 
                    ? "rgba(255,255,255,0.3)" 
                    : plan.highlighted 
                    ? "var(--accent-button-text)" 
                    : "white",
                  cursor: isCurrentPlan || loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {isCurrentPlan ? "Current" : loading ? "..." : plan.name}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
