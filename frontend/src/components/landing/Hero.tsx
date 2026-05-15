"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";

function FloatingMockup() {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "800px",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Desktop Dashboard */}
      <div
        style={{
          borderRadius: "20px",
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.06)",
          overflow: "hidden",
          boxShadow: "0 30px 90px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between" style={{ height: "48px", padding: "0 20px", borderBottom: "1px solid rgba(0,0,0,0.05)", background: "#fafbfc" }}>
          <div className="flex items-center" style={{ gap: "8px" }}>
            {["#D85A30", "#BA7517", "#1D9E75"].map((c, i) => (
              <div key={i} style={{ width: "10px", height: "10px", borderRadius: "9999px", background: c }} />
            ))}
            <span style={{ marginLeft: "6px", fontSize: "12px", color: "#5a6375", fontWeight: 500 }}>OmniLaunch Dashboard</span>
          </div>
          <div className="flex items-center" style={{ gap: "12px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #7F77DD, #5c7cfa)" }} />
          </div>
        </div>

        {/* Dashboard content */}
        <div className="flex" style={{ minHeight: "340px" }}>
          {/* Sidebar */}
          <div style={{ width: "60px", borderRight: "1px solid rgba(0,0,0,0.08)", background: "#eef0f5", display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0", gap: "14px" }}>
            {["#7F77DD", "#d0daf0", "#d0daf0", "#d0daf0", "#d0daf0"].map((c, i) => (
              <div key={i} style={{ width: "26px", height: "26px", borderRadius: "7px", background: c }} />
            ))}
          </div>

          {/* Main area */}
          <div style={{ flex: 1, padding: "18px", display: "flex", flexDirection: "column", gap: "14px", background: "#f4f5f8" }}>
            {/* Row 1: Stats cards */}
            <div className="flex" style={{ gap: "12px" }}>
              {[
                { label: "Total Posts", val: "12,450", change: "+8.2%", col: "#7F77DD" },
                { label: "Engagement", val: "94.2%", change: "+2.1%", col: "#1D9E75" },
                { label: "Launches", val: "1,203", change: "+12%", col: "#D4F542" },
              ].map((s) => (
                <div key={s.label} style={{ flex: 1, background: "#ffffff", borderRadius: "12px", padding: "14px", border: "1px solid rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: "10px", color: "#8b94a7", marginBottom: "4px" }}>{s.label}</div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "#1a1f2e" }}>{s.val}</div>
                  <div style={{ fontSize: "10px", color: s.col, fontWeight: 600, marginTop: "2px" }}>{s.change}</div>
                </div>
              ))}
            </div>

            {/* Row 2: Chart + Activity */}
            <div className="flex" style={{ gap: "12px", flex: 1 }}>
              {/* Chart area */}
              <div style={{ flex: 1.4, background: "#ffffff", borderRadius: "12px", padding: "16px", border: "1px solid rgba(0,0,0,0.04)", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a1f2e", marginBottom: "10px" }}>Launch Analytics</div>
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "6px", paddingBottom: "4px" }}>
                  {[40, 55, 45, 70, 60, 85, 75, 90, 80, 100, 95, 88].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: "3px", background: i >= 9 ? "#7F77DD" : "#e0e4f0" }} />
                  ))}
                </div>
                <div className="flex" style={{ gap: "6px", marginTop: "6px" }}>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                    <div key={m} style={{ flex: 1, fontSize: "8px", color: "#8b94a7", textAlign: "center" }}>{i % 3 === 0 ? m : ""}</div>
                  ))}
                </div>
              </div>

              {/* Activity feed */}
              <div style={{ flex: 1, background: "#ffffff", borderRadius: "12px", padding: "16px", border: "1px solid rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a1f2e", marginBottom: "10px" }}>Recent Activity</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { name: "Sarah Chen", action: "Published on Twitter", time: "2m ago", av: "#7F77DD" },
                    { name: "Mike Ross", action: "Launched on PH", time: "15m ago", av: "#1D9E75" },
                    { name: "Alex Kim", action: "Voice trained", time: "1h ago", av: "#D4F542" },
                  ].map((a) => (
                    <div key={a.name} className="flex items-center" style={{ gap: "8px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: a.av, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#1a1f2e" }}>{a.name}</div>
                        <div style={{ fontSize: "10px", color: "#8b94a7" }}>{a.action}</div>
                      </div>
                      <div style={{ fontSize: "9px", color: "#b0b8cc" }}>{a.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phone overlay */}
      <div
        style={{
          position: "absolute",
          bottom: "-30px",
          left: "-40px",
          width: "210px",
          borderRadius: "24px",
          background: "linear-gradient(180deg, #1a1133 0%, #0d0820 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)",
          zIndex: 2,
        }}
      >
        {/* Phone notch area */}
        <div style={{ height: "26px", background: "#0d0820", position: "relative" }}>
          <div style={{ position: "absolute", top: "6px", left: "50%", transform: "translateX(-50%)", width: "55px", height: "15px", background: "#1a1133", borderRadius: "8px" }} />
        </div>
        {/* Phone content */}
        <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Status bar */}
          <div className="flex items-center justify-between" style={{ padding: "0 2px", marginBottom: "2px" }}>
            <span style={{ fontSize: "9px", fontWeight: 600, color: "#ffffff" }}>9:41</span>
            <div className="flex items-center" style={{ gap: "4px" }}>
              <div style={{ width: "10px", height: "6px", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "1px" }} />
              <div style={{ width: "12px", height: "6px", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "1px" }} />
            </div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>OmniLaunch</span>
            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "linear-gradient(135deg, #C0FF33, #a3e635)" }} />
          </div>

          {/* Date range */}
          <div className="flex items-center" style={{ gap: "6px", marginBottom: "2px" }}>
            <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)" }}>This Month</span>
            <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.3)" }}>|</span>
            <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)" }}>16 Launches</span>
          </div>

          {/* Launch Stats card */}
          <div style={{ background: "linear-gradient(145deg, #1e1a3a, #15122e)", borderRadius: "14px", padding: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>Voice DNA Match</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff" }}>94%</div>
            <div className="flex items-center" style={{ gap: "6px", marginTop: "4px", marginBottom: "10px" }}>
              <span style={{ fontSize: "10px", color: "#D4F542", fontWeight: 600 }}>+2.4%</span>
              <div className="flex items-center" style={{ gap: "4px" }}>
                <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#1DA1F2" }} />
                <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.5)" }}>Twitter</span>
              </div>
              <div className="flex items-center" style={{ gap: "4px" }}>
                <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#0A66C2" }} />
                <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.5)" }}>LinkedIn</span>
              </div>
            </div>
            <div className="flex" style={{ gap: "6px" }}>
              <div style={{ flex: 1, height: "28px", borderRadius: "7px", background: "linear-gradient(135deg, #C0FF33, #a3e635)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "#0f172a" }}>New Launch</div>
              <div style={{ flex: 1, height: "28px", borderRadius: "7px", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 600, color: "#ffffff" }}>Voice Lab</div>
            </div>
          </div>

          {/* Recent Launch */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "12px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>Latest Launch</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff" }}>SaaS Product Launch</div>
              <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>3 platforms · 12 posts</div>
            </div>
            <div style={{ fontSize: "9px", color: "#D4F542", fontWeight: 600, background: "rgba(163,230,53,0.1)", padding: "3px 8px", borderRadius: "6px" }}>Live</div>
          </div>

          {/* Bottom nav */}
          <div className="flex items-center justify-around" style={{ marginTop: "2px", padding: "6px 0" }}>
            {[
              { icon: "#7F77DD", active: true },
              { icon: "rgba(255,255,255,0.2)", active: false },
              { icon: "rgba(255,255,255,0.2)", active: false },
              { icon: "rgba(255,255,255,0.2)", active: false },
            ].map((n, i) => (
              <div key={i} style={{ width: "22px", height: "22px", borderRadius: "6px", background: n.icon }} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Hero() {
  const router = useRouter();

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        paddingTop: "64px",
        fontFamily: "var(--font-sans)",
        background: "transparent",
        overflow: "hidden",
      }}
    >
      {/* Main hero content */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 items-center"
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 24px 80px 48px", gap: "48px" }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Social proof badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
            className="flex items-center"
            style={{
              width: "fit-content",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: "13px",
              fontWeight: 500,
              color: "#ffffff",
            }}
          >
            <Star size={14} style={{ color: "var(--accent-amber)", fill: "var(--accent-amber)" }} />
            <span>1,200+ 5 Star reviews</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
            style={{
              fontSize: "clamp(40px, 5vw, 62px)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#ffffff",
              margin: 0,
              fontFamily: "var(--font-heading)",
            }}
          >
            The AI Launch <span style={{ color: "var(--accent-lime)" }}>Platform</span><br />for Indie Hackers
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
            style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.85)",
              maxWidth: "480px",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            OmniLaunch brings all your product launches into one automated pipeline — ensuring platform-native posts, voice-matched writing, and zero AI slop at any scale.
          </motion.p>

          {/* Email capture */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
            className="flex items-center"
            style={{
              gap: "0",
              marginTop: "4px",
              maxWidth: "440px",
              borderRadius: "10px",
              border: "1px solid rgba(0,0,0,0.06)",
              background: "#ffffff",
              padding: "4px",
            }}
          >
            <input
              type="email"
              placeholder="What's your email?"
              style={{
                flex: 1,
                height: "44px",
                padding: "0 14px",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#1a1f2e",
                fontSize: "14px",
                fontFamily: "var(--font-sans)",
              }}
            />
            <button
              suppressHydrationWarning
              onClick={() => router.push("/signup")}
              style={{
                height: "44px",
                padding: "0 20px",
                borderRadius: "8px",
                border: "none",
                background: "#D4F542",
                color: "#0f1a4a",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                whiteSpace: "nowrap",
                transition: "opacity 0.15s ease, transform 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Get Started
            </button>
          </motion.div>
        </div>

        {/* Right column — mockup */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
          style={{ display: "flex", justifyContent: "center", position: "relative" }}
        >
          {/* Radial glow behind mockup — primary royal blue */}
          <div
            style={{
              position: "absolute",
              top: "45%",
              left: "55%",
              transform: "translate(-50%, -50%)",
              width: "680px",
              height: "520px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(65, 105, 225, 0.60) 0%, rgba(80, 90, 240, 0.35) 30%, rgba(95, 75, 215, 0.18) 55%, transparent 75%)",
              filter: "blur(60px)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          {/* Secondary violet glow for depth */}
          <div
            style={{
              position: "absolute",
              top: "40%",
              left: "60%",
              transform: "translate(-50%, -50%)",
              width: "480px",
              height: "380px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(138, 43, 226, 0.28) 0%, rgba(100, 80, 220, 0.12) 45%, transparent 70%)",
              filter: "blur(50px)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <FloatingMockup />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
