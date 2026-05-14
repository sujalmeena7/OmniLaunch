"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const INPUT_TEXT = "A notion-style AI writing assistant for engineers.";
const OUTPUTS = [
  { platform: "Twitter", text: "Just shipped an AI writing tool built for engineers. Notion-style blocks. Zero fluff. Try it →" },
  { platform: "LinkedIn", text: "We're excited to launch our AI Writing Assistant — built specifically for engineers who value clean UX and fast workflows." },
  { platform: "Reddit", text: "[Showoff Saturday] Built an AI writing assistant with a Notion-style block editor. Works in the browser. No signup wall. What do you think?" },
];

export default function LiveDemo() {
  const [step, setStep] = useState(0); // 0 = input, 1 = processing, 2 = outputs
  const [typedLength, setTypedLength] = useState(0);

  useEffect(() => {
    // Typing animation
    if (step === 0) {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setTypedLength(i);
        if (i >= INPUT_TEXT.length) {
          clearInterval(interval);
          setTimeout(() => setStep(1), 400);
        }
      }, 40);
      return () => clearInterval(interval);
    }
    if (step === 1) {
      const t = setTimeout(() => setStep(2), 2000);
      return () => clearTimeout(t);
    }
  }, [step]);

  return (
    <section
      style={{
        background: "#ffffff",
        padding: "100px 20px",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        className="grid grid-cols-1 lg:grid-cols-2 items-center"
        style={{ maxWidth: "1100px", margin: "0 auto", gap: "48px" }}
      >
        {/* Left: text */}
        <ScrollReveal>
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "9999px",
                background: "rgba(92, 124, 250, 0.08)",
                border: "1px solid rgba(92, 124, 250, 0.15)",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--brand-400)",
                marginBottom: "16px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Live Demo
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
              Your voice. Every platform.
            </h2>
            <p
              style={{
                fontSize: "16px",
                lineHeight: 1.7,
                color: "#5a6a8a",
                margin: "0 0 28px 0",
                maxWidth: "460px",
              }}
            >
              Type a product description. Select your platforms. Watch OmniLaunch generate native posts that sound like you wrote them — because technically, you did.
            </p>
            <button
              onClick={() => setStep(0)}
              className="flex items-center"
              style={{
                height: "44px",
                padding: "0 20px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, var(--accent-teal), #1a9e7a)",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(29, 158, 117, 0.25)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(29, 158, 117, 0.35)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(29, 158, 117, 0.25)"; }}
            >
              Try the demo
              <ArrowRight size={16} />
            </button>
          </div>
        </ScrollReveal>

        {/* Right: terminal mock */}
        <ScrollReveal delay={0.1}>
          <div
            style={{
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: "16px",
              background: "#0a0a0f",
              overflow: "hidden",
              boxShadow: "0 24px 64px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05), 0 0 40px rgba(92, 124, 250, 0.08)",
            }}
          >
            {/* Bar */}
            <div
              className="flex items-center"
              style={{
                height: "40px",
                padding: "0 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                gap: "6px",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              {["#D85A30", "#BA7517", "#1D9E75"].map((c, i) => (
                <div key={i} style={{ width: "10px", height: "10px", borderRadius: "9999px", background: c }} />
              ))}
              <span style={{ marginLeft: "8px", fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>OmniLaunch Demo</span>
            </div>

            {/* Body */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", minHeight: "280px" }}>
              {/* Input */}
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
                  Product description
                </div>
                <div
                  style={{
                    width: "100%",
                    minHeight: "48px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                    padding: "12px 14px",
                    fontSize: "14px",
                    color: "#e8e8ee",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {step === 0 ? (
                    <>
                      {INPUT_TEXT.slice(0, typedLength)}
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        style={{ display: "inline-block", width: "2px", height: "14px", background: "var(--accent-teal)", verticalAlign: "middle", marginLeft: "2px" }}
                      />
                    </>
                  ) : (
                    INPUT_TEXT
                  )}
                </div>
              </div>

              {/* Processing */}
              <AnimatePresence>
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "9999px",
                        border: "2px solid var(--border-default)",
                        borderTopColor: "var(--accent-teal)",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>Generating posts</span>
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ fontSize: "13px", color: "var(--text-muted)" }}
                    >
                      ...
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Outputs */}
              <AnimatePresence>
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col"
                    style={{ gap: "10px" }}
                  >
                    {OUTPUTS.map((out, i) => (
                      <motion.div
                        key={out.platform}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                        style={{
                          borderRadius: "10px",
                          border: "1px solid rgba(255,255,255,0.06)",
                          background: "rgba(255,255,255,0.03)",
                          padding: "14px",
                        }}
                      >
                        <div className="flex items-center" style={{ gap: "8px", marginBottom: "8px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: out.platform === "Twitter" ? "#1DA1F2" : out.platform === "LinkedIn" ? "#0A66C2" : "#FF4500" }} />
                          <div
                            style={{
                              fontSize: "10px",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              color: "rgba(255,255,255,0.4)",
                            }}
                          >
                            {out.platform}
                          </div>
                        </div>
                        <div style={{ fontSize: "13px", color: "#c8c8d4", lineHeight: 1.6 }}>
                          {out.text}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
