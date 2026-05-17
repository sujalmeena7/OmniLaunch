"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Bell, Rocket, Menu, Moon, Sun, ArrowRightLeft, ChevronRight, LogOut, Settings as SettingsIcon, CreditCard, BookA, Palette } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/stores/appStore";
import { useThemeStore } from "@/stores/themeStore";
import CommandPalette from "./CommandPalette";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { Tooltip } from "@/components/ui/Tooltip";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Statistics",
  "/dashboard/launch": "Launch",
  "/dashboard/voice-lab": "Voice Lab",
  "/dashboard/bundles": "Bundles",
  "/dashboard/settings": "Settings",
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, setMobileSidebarOpen, logout } = useAppStore();
  const { theme, toggleTheme } = useThemeStore();

  const title = PAGE_TITLES[pathname] || "Dashboard";

  const initials =
    user?.display_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    user?.email?.slice(0, 2).toUpperCase() ||
    "??";

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

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  const handleLogout = () => {
    api.clearToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("omnilaunch_token");
      localStorage.removeItem("omnilaunch_refresh");
      window.location.href = "/";
    }
  };

  const handleNav = (href: string) => {
    router.push(href);
    setProfileOpen(false);
  };

  const launchesPerMonth = user?.launches_per_month || 0;
  const launchesRemaining = user?.launches_remaining || 0;
  const launchesUsed = Math.max(0, launchesPerMonth - launchesRemaining);
  const quotaPercentage = launchesPerMonth > 0 ? (launchesUsed / launchesPerMonth) * 100 : 0;
  // SVG Circle calculation
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (quotaPercentage / 100) * circumference;

  return (
    <>
      <header
        className="flex items-center justify-between flex-shrink-0 relative z-50"
        style={{
          height: "80px",
          padding: "0 16px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-header-glass)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Left: Hamburger (mobile) + Page title */}
        <div className="flex items-center gap-3">
          {/* Hamburger menu button — visible only on mobile */}
          <button
            className="flex md:hidden items-center justify-center"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "var(--bg-input-tint)",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
            }}
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={20} style={{ color: "var(--text-secondary)" }} />
          </button>

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
            <span
              className="hidden md:block"
              style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              OmniLaunch Cloud / Production
            </span>
          </div>
        </div>

        {/* Center: Search bar (opens command palette on click) — hidden on mobile */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="hidden md:flex items-center group"
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
          {/* Quick Launch button — hidden on mobile */}
          <button
            onClick={() => (window.location.href = "/dashboard/launch")}
            className="hidden md:flex items-center"
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

          {/* Theme Toggle — hidden on mobile */}
          <Tooltip content={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} position="bottom">
            <button
              onClick={toggleTheme}
              className="hidden md:flex items-center justify-center"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: "var(--bg-input-tint)",
                border: "1px solid var(--border-subtle)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-input-tint-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-input-tint)"; }}
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? (
                <Moon size={18} style={{ color: "var(--text-secondary)" }} />
              ) : (
                <Sun size={18} style={{ color: "var(--text-secondary)" }} />
              )}
            </button>
          </Tooltip>

          {/* Notification bell — hidden on mobile */}
          <Tooltip content="Notifications" position="bottom">
            <button
              className="hidden md:flex items-center justify-center"
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
          </Tooltip>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center justify-center relative"
              style={{
                width: "48px",
                height: "48px",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                padding: 0
              }}
            >
              {/* Circular Progress Ring */}
              <svg width="48" height="48" viewBox="0 0 48 48" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
                <circle
                  cx="24" cy="24" r={radius}
                  fill="none"
                  stroke="var(--border-subtle)"
                  strokeWidth="3"
                />
                <circle
                  cx="24" cy="24" r={radius}
                  fill="none"
                  stroke="var(--text-secondary)"
                  strokeWidth="3"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              
              {/* Avatar Image / Initials */}
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "var(--bg-avatar)",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden"
                }}
              >
                {initials}
              </div>
              
              {/* Status dot */}
              <div 
                style={{ 
                  position: "absolute", 
                  top: "2px", 
                  right: "2px", 
                  width: "10px", 
                  height: "10px", 
                  borderRadius: "50%", 
                  background: "var(--text-secondary)", 
                  border: "2px solid var(--bg-surface)",
                  zIndex: 10
                }} 
              />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 12px)",
                    right: 0,
                    width: "320px",
                    background: "var(--bg-elevated)",
                    borderRadius: "20px",
                    boxShadow: "var(--shadow-lg)",
                    border: "1px solid var(--border-subtle)",
                    padding: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    zIndex: 100,
                  }}
                >
                  {/* Balance Card */}
                  <div style={{ padding: "16px", borderRadius: "14px", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid var(--text-muted)", opacity: 0.5 }} />
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)" }}>Balance</span>
                      </div>
                      <button 
                        onClick={() => handleNav("/dashboard/subscription")}
                        style={{ padding: "4px 12px", background: "var(--text-secondary)", color: "var(--bg-surface)", borderRadius: "8px", fontSize: "12px", fontWeight: 700, border: "none", cursor: "pointer" }}
                      >
                        Upgrade
                      </button>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>Total</span>
                        <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 700 }}>{launchesPerMonth} launches</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>Remaining</span>
                        <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 700 }}>{launchesRemaining}</span>
                      </div>
                    </div>
                  </div>

                  {/* Current Workspace Card */}
                  <div style={{ padding: "16px", borderRadius: "14px", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>Current workspace</span>
                      <span style={{ fontSize: "15px", color: "var(--text-secondary)", fontWeight: 700 }}>{user?.display_name ? `${user.display_name}'s Workspace` : 'Personal Workspace'}</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, textTransform: "capitalize" }}>{user?.plan || "Free"} plan</span>
                    </div>
                    <button style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "var(--bg-input-tint)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", cursor: "pointer" }}>
                      <ArrowRightLeft size={14} />
                    </button>
                  </div>

                  {/* Links */}
                  <div style={{ display: "flex", flexDirection: "column", padding: "4px 0" }}>
                    <button onClick={() => handleNav("/dashboard/settings")} className="group" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px", background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}>
                      <SettingsIcon size={16} style={{ color: "var(--text-muted)" }} className="group-hover:text-[var(--text-secondary)] transition-colors" />
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 500 }}>Settings</span>
                    </button>
                    <button onClick={() => handleNav("/dashboard/settings")} className="group" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px", background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}>
                      <SettingsIcon size={16} style={{ color: "var(--text-muted)" }} className="group-hover:text-[var(--text-secondary)] transition-colors" />
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 500 }}>Workspace settings</span>
                    </button>
                    <button onClick={() => handleNav("/dashboard/subscription")} className="group" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px", background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}>
                      <CreditCard size={16} style={{ color: "var(--text-muted)" }} className="group-hover:text-[var(--text-secondary)] transition-colors" />
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 500 }}>Subscription</span>
                    </button>
                    <button className="group" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px", background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}>
                      <BookA size={16} style={{ color: "var(--text-muted)" }} className="group-hover:text-[var(--text-secondary)] transition-colors" />
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 500 }}>Pronunciation dictionaries</span>
                    </button>
                    <button onClick={toggleTheme} className="group" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "10px", background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <Palette size={16} style={{ color: "var(--text-muted)" }} className="group-hover:text-[var(--text-secondary)] transition-colors" />
                        <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 500 }}>Theme</span>
                      </div>
                      <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                    </button>
                  </div>

                  <div style={{ height: "1px", background: "var(--border-subtle)", margin: "4px 12px" }} />

                  <button onClick={handleLogout} className="group" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px", background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}>
                    <LogOut size={16} style={{ color: "#ef4444" }} />
                    <span style={{ fontSize: "14px", color: "#ef4444", fontWeight: 600 }}>Sign out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Command Palette Portal */}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </>
  );
}
