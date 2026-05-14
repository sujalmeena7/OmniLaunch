"use client";

import ScrollReveal from "./ScrollReveal";

const TESTIMONIALS = [
  {
    quote:
      "I used to spend 3 hours rewriting the same launch for different platforms. OmniLaunch does it in 3 minutes and it actually sounds like me.",
    name: "Alex Chen",
    handle: "@alexbuilds",
  },
  {
    quote:
      "The voice training is scary good. My LinkedIn posts hit different now — more engagement, less 'AI slop' comments.",
    name: "Sarah Kim",
    handle: "Founder at Vercelify",
  },
  {
    quote:
      "Shipped our Product Hunt + Twitter + IndieHackers launch in one afternoon. Previously took two days.",
    name: "Marcus O.",
    handle: "Indie Hacker",
  },
];

export default function Testimonials() {
  return (
    <section
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
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "9999px",
              background: "rgba(212, 245, 66, 0.08)",
              border: "1px solid rgba(212, 245, 66, 0.15)",
              fontSize: "12px",
              fontWeight: 600,
              color: "#9ab020",
              marginBottom: "16px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Testimonials
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
            What Founders Say
          </h2>
          <p style={{ fontSize: "16px", color: "#5a6a8a", margin: 0 }}>
            Trusted by indie hackers shipping every day
          </p>
        </div>
      </ScrollReveal>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "24px" }}>
        {TESTIMONIALS.map((t, i) => {
          const avColors = ["#7F77DD", "#1D9E75", "#D4F542"];
          return (
            <ScrollReveal key={t.name} delay={i * 0.1}>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  border: "1px solid rgba(0,0,0,0.05)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)"; }}
              >
                {/* Quote mark */}
                <div style={{ fontSize: "40px", lineHeight: 1, color: "rgba(127, 119, 221, 0.15)", fontFamily: "serif", marginBottom: "8px" }}>
                  &#8220;
                </div>
                <p
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.65,
                    color: "#4a5568",
                    margin: "0 0 24px 0",
                    flex: 1,
                  }}
                >
                  {t.quote}
                </p>
                <div className="flex items-center" style={{ gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${avColors[i]}, ${avColors[i]}aa)`,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#0f1a4a",
                      }}
                    >
                      {t.name}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#8b94a7",
                        marginTop: "1px",
                      }}
                    >
                      {t.handle}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
