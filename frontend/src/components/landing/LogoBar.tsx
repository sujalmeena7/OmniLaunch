"use client";

import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const PLATFORMS = [
  "Twitter / X",
  "LinkedIn",
  "Reddit",
  "Product Hunt",
  "IndieHackers",
  "Hacker News",
];

export default function LogoBar() {
  return (
    <section
      style={{
        borderTop: "1px solid rgba(255,255,255,0.08)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "transparent",
        padding: "28px 20px",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto", textAlign: "center" }}>
        <ScrollReveal>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#1a2d6e",
              margin: "0 0 20px 0",
            }}
          >
            1,200+ indie hackers have saved hours launching with OmniLaunch
          </p>
        </ScrollReveal>

        <div
          className="flex items-center justify-center flex-wrap"
          style={{ gap: "32px" }}
        >
          {PLATFORMS.map((name, i) => (
            <motion.span
              key={name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#3d5296",
                letterSpacing: "-0.01em",
              }}
            >
              {name}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
