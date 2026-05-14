"use client";

import { motion } from "framer-motion";
import {
  AudioWaveform,
  Globe,
  Zap,
  ShieldCheck,
  BarChart3,
  History,
  ArrowRight,
} from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const FEATURES = [
  {
    icon: AudioWaveform,
    title: "Voice Training",
    description: "Upload writing samples. We build a Tone Manifesto that sounds exactly like you.",
    iconBg: "rgba(29, 158, 117, 0.12)",
    iconColor: "var(--accent-teal)",
  },
  {
    icon: Globe,
    title: "Platform Intelligence",
    description: "Every post is optimized for the platform's culture — not generic copy-paste.",
    iconBg: "rgba(186, 117, 23, 0.12)",
    iconColor: "var(--accent-amber)",
  },
  {
    icon: Zap,
    title: "One-Click Launch",
    description: "Generate, preview, edit, and publish your entire launch bundle in under 60 seconds.",
    iconBg: "rgba(92, 124, 250, 0.12)",
    iconColor: "var(--brand-400)",
  },
  {
    icon: ShieldCheck,
    title: "Real-Time Validation",
    description: "Character counts, tone checks, and AI-ism removal before you ship.",
    iconBg: "rgba(29, 158, 117, 0.12)",
    iconColor: "var(--accent-teal)",
  },
  {
    icon: BarChart3,
    title: "Voice Match Scoring",
    description: "See how closely each post matches your trained voice profile.",
    iconBg: "rgba(186, 117, 23, 0.12)",
    iconColor: "var(--accent-amber)",
  },
  {
    icon: History,
    title: "Launch History",
    description: "Track every bundle, every edit, every platform — organized and searchable.",
    iconBg: "rgba(92, 124, 250, 0.12)",
    iconColor: "var(--brand-400)",
  },
];

export default function Features() {
  return (
    <section
      id="features"
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
        <div style={{ marginBottom: "56px", maxWidth: "560px" }}>
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
            Features
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
            Everything you need to launch
          </h2>
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.7,
              color: "#5a6a8a",
              margin: 0,
            }}
          >
            OmniLaunch brings powerful new ways to write and ship, made for serious indie hackers and fast-moving SaaS teams.
          </p>
        </div>
      </ScrollReveal>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: "20px" }}>
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <ScrollReveal key={f.title} delay={i * 0.08}>
              <motion.div
                className="flex flex-col"
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(0,0,0,0.05)",
                  borderRadius: "16px",
                  padding: "28px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
                  cursor: "default",
                  height: "100%",
                }}
                whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)" }}
                transition={{ duration: 0.25 }}
              >
                {/* Icon circle */}
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: f.iconBg,
                    border: `1px solid ${f.iconBg.replace('0.12', '0.20')}`,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} style={{ color: f.iconColor }} />
                </div>

                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    lineHeight: 1.3,
                    color: "#0f1a4a",
                    marginTop: "16px",
                    marginBottom: 0,
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.65,
                    color: "#5a6a8a",
                    marginTop: "8px",
                    marginBottom: 0,
                    flex: 1,
                  }}
                >
                  {f.description}
                </p>

                {/* Arrow link */}
                <div
                  className="flex items-center"
                  style={{
                    marginTop: "16px",
                    gap: "4px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--accent-teal)",
                    cursor: "pointer",
                    transition: "gap 0.2s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.gap = "6px"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.gap = "4px"; }}
                >
                  <span>Learn more</span>
                  <ArrowRight size={14} />
                </div>
              </motion.div>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
