"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Rocket,
  AudioWaveform,
  Package,
  LayoutDashboard,
  SlidersHorizontal,
  Moon,
  Sun,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useThemeStore } from "@/stores/themeStore";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/launch", label: "Launch", icon: Rocket },
  { href: "/dashboard/voice-lab", label: "Voice Lab", icon: AudioWaveform },
  { href: "/dashboard/bundles", label: "Bundles", icon: Package },
  { href: "/dashboard/settings", label: "Settings", icon: SlidersHorizontal },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, sidebarOpen } = useAppStore();
  const { theme, toggleTheme } = useThemeStore();

  const initials =
    user?.display_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    user?.email?.slice(0, 2).toUpperCase() ||
    "??";

  return (
    <aside
      className="flex flex-col overflow-hidden"
      style={{
        width: sidebarOpen ? "260px" : "72px",
        background: "var(--bg-sidebar-glass)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid var(--border-subtle)",
        transition: "width 0.25s ease",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3"
        style={{
          height: "80px",
          padding: "0 24px",
          marginBottom: "8px",
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "12px",
            background: "var(--accent-button-bg)",
            boxShadow: "var(--accent-icon-shadow)",
            flexShrink: 0,
          }}
        >
          <Rocket size={18} style={{ color: "var(--accent-button-text)" }} />
        </div>
        {sidebarOpen && (
          <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-secondary)", fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
            OmniLaunch
          </span>
        )}
      </div>

      {/* User Profile */}
      {sidebarOpen && (
        <div
          className="flex flex-col items-center"
          style={{ padding: "24px 20px", borderBottom: "1px solid var(--border-profile)" }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "var(--bg-avatar)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--text-avatar)",
              marginBottom: "12px",
            }}
          >
            {initials}
          </div>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-secondary)" }}>
            {user?.display_name || "User"}
          </span>
          <button
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              marginTop: "2px",
              fontFamily: "var(--font-sans)",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
            onClick={() => router.push("/dashboard/settings")}
          >
            Edit Profile
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 flex flex-col" style={{ padding: "16px 14px", gap: "6px" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <motion.button
              key={item.href}
              whileHover={{ x: 2 }}
              onClick={() => router.push(item.href)}
              className="flex items-center gap-3 w-full text-left"
              style={{
                height: "44px",
                padding: sidebarOpen ? "0 14px" : "0 10px",
                borderRadius: "14px",
                border: "none",
                background: isActive
                  ? "var(--bg-nav-active)"
                  : "transparent",
                color: isActive ? "var(--text-secondary)" : "var(--text-primary)",
                fontSize: "14px",
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                position: "relative",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  style={{
                    position: "absolute",
                    left: 0,
                    width: "3px",
                    height: "18px",
                    background: "var(--accent-lime)",
                    borderRadius: "0 4px 4px 0",
                    boxShadow: "0 0 10px var(--accent-lime)",
                  }}
                />
              )}
              <Icon
                size={18}
                style={{
                  color: isActive ? "var(--accent-lime)" : "var(--text-muted)",
                  flexShrink: 0,
                  opacity: isActive ? 1 : 0.7,
                }}
              />
              {sidebarOpen && (
                <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div
        className="flex flex-col"
        style={{ padding: "16px 14px", gap: "12px", borderTop: "1px solid var(--border-subtle)" }}
      >
        {sidebarOpen && (
          <div
            role="switch"
            aria-checked={theme === "dark"}
            aria-label="Toggle dark mode"
            tabIndex={0}
            className="flex items-center justify-between"
            style={{ padding: "0 6px", cursor: "pointer" }}
            onClick={toggleTheme}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleTheme();
              }
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Light</span>
            <div
              style={{
                width: "36px",
                height: "20px",
                borderRadius: "10px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  left: theme === "dark" ? "18px" : "2px",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: "var(--accent-lime)",
                  transition: "left 0.2s ease",
                }}
              />
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Dark</span>
          </div>
        )}
        {!sidebarOpen && (
          <div
            role="switch"
            aria-checked={theme === "dark"}
            aria-label="Toggle dark mode"
            tabIndex={0}
            className="flex items-center justify-center"
            style={{ cursor: "pointer" }}
            onClick={toggleTheme}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleTheme();
              }
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "var(--bg-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {theme === "dark" ? (
                <Moon size={14} style={{ color: "var(--accent-lime)" }} />
              ) : (
                <Sun size={14} style={{ color: "var(--accent-lime)" }} />
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
