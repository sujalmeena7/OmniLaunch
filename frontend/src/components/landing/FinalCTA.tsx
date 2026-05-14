"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function FinalCTA() {
  const router = useRouter();

  return (
    <section style={{ padding: "100px 20px", textAlign: "center", fontFamily: "var(--font-sans)", background: "#ffffff" }}>
      <ScrollReveal>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#0f1a4a", margin: "0 0 16px 0", fontFamily: "var(--font-heading)" }}>
          Ready to launch?
        </h2>
        <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#4a5568", maxWidth: "440px", margin: "0 auto 28px" }}>
          Join 1,200+ founders who ship faster with OmniLaunch.
        </p>
        <button
          suppressHydrationWarning
          onClick={() => router.push("/signup")}
          className="flex items-center"
          style={{
            height: "48px",
            padding: "0 28px",
            borderRadius: "8px",
            border: "none",
            background: "var(--accent-lime)",
            color: "#0a0a0a",
            fontSize: "16px",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            gap: "8px",
            margin: "0 auto",
            transition: "opacity 0.15s ease, transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          Get started free
          <ArrowRight size={18} />
        </button>
      </ScrollReveal>
    </section>
  );
}
