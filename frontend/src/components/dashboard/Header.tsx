"use client";

import { useState, useEffect } from "react";
import { Search, Bell, Rocket } from "lucide-react";
import { usePathname } from "next/navigation";
import CommandPalette from "./CommandPalette";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Statistics",
  "/dashboard/launch": "Launch",
  "/dashboard/voice-lab": "Voice Lab",
  "/dashboard/bundles": "Bundles",
  "/dashboard/settings": "Settings",
};

export default function Header() {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const title = PAGE_TITLES[pathname] || "Dashboard";

  // Listen for ⌘K / Ctrl+K to open palette
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header
        className="flex items-center justify-between flex-shrink-0"
        style={{
          height: "80px",
          padding: "0 32px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-header-glass)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Left: Page title */}
        <div className="flex flex-col">
          <span
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "var(--text-secondary)",
              fontFamily: "var(--font-heading)",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            OmniLaunch Cloud / Production
          </span>
        </div>

        {/* Center: Search bar (opens command palette on click) */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center group"
          style={{
            height: "44px",
            borderRadius: "14px",
            background: "var(--bg-input-tint)",
            border: "1px solid var(--border-subtle)",
            padding: "0 16px",
            gap: "10px",
            width: "320px",
            transition: "all 0.2s ease",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          <Search size={16} style={{ color: "var(--text-muted)", opacity: 0.6 }} />
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "14px",
              flex: 1,
              textAlign: "left",
            }}
          >
            Search bundles, voices...
          </span>
          <div style={{ padding: "2px 6px", borderRadius: "4px", background: "var(--bg-badge-tint)", fontSize: "10px", color: "var(--text-muted)", fontWeight: 700 }}>⌘K</div>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center" style={{ gap: "16px" }}>
          {/* Quick Launch button */}
          <button
            onClick={() => (window.location.href = "/dashboard/launch")}
            className="flex items-center"
            style={{
              height: "44px",
              padding: "0 20px",
              borderRadius: "12px",
              background: "var(--accent-button-bg)",
              color: "var(--accent-button-text)",
              fontSize: "14px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              gap: "8px",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "var(--accent-button-shadow)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "var(--accent-button-shadow-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--accent-button-shadow)";
            }}
          >
            <Rocket size={16} />
            <span>New Launch</span>
          </button>

          {/* Notification bell */}
          <button
            className="flex items-center justify-center"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "var(--bg-input-tint)",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-input-tint-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-input-tint)"; }}
          >
            <Bell size={18} style={{ color: "var(--text-secondary)" }} />
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--color-notification)",
                boxShadow: "var(--shadow-notification)",
              }}
            />
          </button>
        </div>
      </header>

      {/* Command Palette Portal */}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </>
  );
}
