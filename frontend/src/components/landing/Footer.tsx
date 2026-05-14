"use client";

const FOOTER_LINKS = ["Features", "Pricing", "Voice Lab", "Docs", "Changelog", "Privacy", "Terms"];

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(0,0,0,0.08)",
        padding: "40px 20px",
        maxWidth: "1100px",
        margin: "0 auto",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        className="flex flex-col md:flex-row items-center justify-between"
        style={{ gap: "20px" }}
      >
        {/* Left */}
        <div className="flex items-center" style={{ gap: "8px" }}>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#0f1a4a" }}>OmniLaunch</span>
          <span style={{ fontSize: "13px", color: "#5a6a8a" }}>© 2026</span>
        </div>

        {/* Center */}
        <div className="flex items-center flex-wrap justify-center" style={{ gap: "16px" }}>
          {FOOTER_LINKS.map((l) => (
            <button
              key={l}
              suppressHydrationWarning
              style={{
                fontSize: "13px",
                color: "#5a6a8a",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#0f1a4a"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#5a6a8a"; }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center" style={{ gap: "16px" }}>
          {["X", "GitHub", "Discord"].map((s) => (
            <span
              key={s}
              style={{
                fontSize: "13px",
                color: "#5a6a8a",
                cursor: "pointer",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#0f1a4a"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#5a6a8a"; }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
