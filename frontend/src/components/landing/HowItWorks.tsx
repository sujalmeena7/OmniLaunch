"use client";

import ScrollReveal from "./ScrollReveal";

const STEPS = [
  {
    number: "01",
    title: "Describe your product",
    description:
      "Paste your product name and a short description. No templates, no prompts to memorize.",
  },
  {
    number: "02",
    title: "Select platforms",
    description:
      "Choose where you want to launch — Twitter, LinkedIn, Reddit, IndieHackers, Product Hunt. One click each.",
  },
  {
    number: "03",
    title: "Generate & publish",
    description:
      "OmniLaunch clones your voice, writes platform-native posts, and validates every character limit and convention.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        padding: "80px 20px",
        maxWidth: "960px",
        margin: "0 auto",
        fontFamily: "var(--font-sans)",
        background: "#ffffff",
      }}
    >
      {/* Header */}
      <ScrollReveal>
        <div style={{ marginBottom: "48px", textAlign: "center" }}>
          <h2
            style={{
              fontSize: "32px",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#0f1a4a",
              margin: "0 0 12px 0",
              fontFamily: "var(--font-heading)",
            }}
          >
            How It Works
          </h2>
          <p style={{ fontSize: "15px", color: "#4a5568", margin: 0 }}>
            Three steps to launch everywhere
          </p>
        </div>
      </ScrollReveal>

      {/* Steps grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-3"
        style={{ gap: "40px" }}
      >
        {STEPS.map((step, i) => (
          <ScrollReveal key={step.number} delay={i * 0.1}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                padding: "28px",
                borderRadius: "12px",
                border: "1px solid rgba(0,0,0,0.05)",
                background: "#fafbfc",
                position: "relative",
              }}
            >
              {/* Connecting line (hidden on last item and mobile) */}
              {i < STEPS.length - 1 && (
                <div
                  className="hidden md:block"
                  style={{
                    position: "absolute",
                    top: "44px",
                    right: "-40px",
                    width: "40px",
                    height: "2px",
                    background: "linear-gradient(to right, rgba(0,0,0,0.08), transparent)",
                  }}
                />
              )}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#D4F542",
                  background: "#0f1a4a",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px",
                }}
              >
                {step.number}
              </span>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  lineHeight: 1.3,
                  color: "#0f1a4a",
                  margin: 0,
                  fontFamily: "var(--font-heading)",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.7,
                  color: "#4a5568",
                  margin: 0,
                }}
              >
                {step.description}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
