"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import ScrollReveal from "./ScrollReveal";

const PLANS = [
  {
    name: "Free",
    price: "Free",
    period: "",
    description: "Perfect for side projects",
    features: ["3 launches / month", "All platforms supported", "Basic voice training"],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/mo",
    description: "For serious builders",
    features: [
      "50 launches / month",
      "All platforms supported",
      "Advanced voice training",
      "Priority generation queue",
    ],
    highlighted: true,
  },
  {
    name: "Team",
    price: "₹1,499",
    period: "/mo",
    description: "For teams shipping together",
    features: [
      "Unlimited launches",
      "All platforms supported",
      "Advanced voice training",
      "Priority generation queue",
    ],
    highlighted: false,
  },
];

export default function Pricing() {
  const router = useRouter();

  return (
    <section
      id="pricing"
      style={{
        padding: "80px 20px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "var(--font-sans)",
        background: "#ffffff",
      }}
    >
      {/* Header */}
      <ScrollReveal>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "9999px",
              background: "rgba(29, 158, 117, 0.08)",
              border: "1px solid rgba(29, 158, 117, 0.15)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--accent-teal)",
              marginBottom: "16px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Pricing
          </div>
          <h2
            style={{
              fontSize: "36px",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "#0f1a4a",
              margin: "0 0 16px 0",
              fontFamily: "var(--font-heading)",
            }}
          >
            Pricing
          </h2>
          <p style={{ fontSize: "16px", color: "#5a6a8a", margin: 0 }}>
            Start free. Scale when you ship.
          </p>
        </div>
      </ScrollReveal>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "24px", alignItems: "stretch" }}>
        {PLANS.map((plan, i) => (
          <ScrollReveal key={plan.name} delay={i * 0.1}>
            <motion.div
              className="flex flex-col"
              style={{
                background: plan.highlighted
                  ? "linear-gradient(165deg, #0f1a4a 0%, #1a2d6e 50%, #0f1a4a 100%)"
                  : "#ffffff",
                border: plan.highlighted
                  ? "1px solid rgba(127, 119, 221, 0.30)"
                  : "1px solid rgba(0,0,0,0.06)",
                borderRadius: "20px",
                padding: "32px",
                cursor: "default",
                boxShadow: plan.highlighted
                  ? "0 24px 64px rgba(15, 26, 74, 0.25), 0 0 0 1px rgba(127, 119, 221, 0.15)"
                  : "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                position: "relative",
                height: "100%",
              }}
              whileHover={{ y: -6 }}
            >
              {/* Most Popular badge */}
              {plan.highlighted && (
                <div
                  style={{
                    position: "absolute",
                    top: "-12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: "5px 14px",
                    borderRadius: "9999px",
                    background: "linear-gradient(135deg, #D4F542, #c5e63a)",
                    color: "#0f1a4a",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    boxShadow: "0 4px 12px rgba(212, 245, 66, 0.3)",
                  }}
                >
                  Most Popular
                </div>
              )}

              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: plan.highlighted ? "#ffffff" : "#0f1a4a",
                  marginBottom: "4px",
                  marginTop: plan.highlighted ? "4px" : "0",
                }}
              >
                {plan.name}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: plan.highlighted ? "rgba(255,255,255,0.6)" : "#8b94a7",
                  marginBottom: "20px",
                }}
              >
                {plan.description}
              </div>
              <div className="flex items-baseline" style={{ gap: "4px", marginBottom: "28px" }}>
                <span style={{ fontSize: "40px", fontWeight: 800, color: plan.highlighted ? "#ffffff" : "#0f1a4a", letterSpacing: "-0.02em" }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: "14px", color: plan.highlighted ? "rgba(255,255,255,0.5)" : "#8b94a7" }}>{plan.period}</span>
              </div>

              <div className="flex flex-col" style={{ gap: "12px", marginBottom: "28px", flex: 1 }}>
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start" style={{ gap: "10px" }}>
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: plan.highlighted ? "rgba(212, 245, 66, 0.15)" : "rgba(29, 158, 117, 0.10)",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    >
                      <Check size={12} style={{ color: plan.highlighted ? "#D4F542" : "var(--accent-teal)", flexShrink: 0 }} />
                    </div>
                    <span style={{ fontSize: "14px", color: plan.highlighted ? "rgba(255,255,255,0.85)" : "#4a5568", lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                suppressHydrationWarning
                onClick={() => router.push("/signup")}
                style={{
                  width: "100%",
                  height: "44px",
                  borderRadius: "10px",
                  border: plan.highlighted ? "none" : "1px solid rgba(0,0,0,0.10)",
                  background: plan.highlighted ? "linear-gradient(135deg, #D4F542, #c5e63a)" : "transparent",
                  color: plan.highlighted ? "#0f1a4a" : "#0f1a4a",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  boxShadow: plan.highlighted ? "0 4px 14px rgba(212, 245, 66, 0.3)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (plan.highlighted) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(212, 245, 66, 0.4)";
                  } else {
                    e.currentTarget.style.background = "rgba(0,0,0,0.03)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (plan.highlighted) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(212, 245, 66, 0.3)";
                  } else {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {plan.highlighted ? "Start free trial" : "Get started"}
              </button>
            </motion.div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
