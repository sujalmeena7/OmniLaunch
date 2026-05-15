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
import { useEscapeHandler } from "@/lib/useKeyboardShortcuts";
import { motion, AnimatePresence } from "framer-motion";
import QuotaDisplay from "@/components/dashboard/QuotaDisplay";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/launch", label: "Launch", icon: Rocket },
  { href: "/dashboard/voice-lab", label: "Voice Lab", icon: AudioWaveform },
  { href: "/dashboard/bundles", label: "Bundles", icon: Package },
  { href: "/dashboard/settings", label: "Settings", icon: SlidersHorizontal },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, sidebarOpen } = useAppStore();
  const { theme, toggleTheme } = useThemeStore();



  const handleNav = (href: string) => {
    router.push(href);
    onNavClick?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div style={{ padding: "32px 24px 24px 24px" }}>
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="flex items-center justify-center shrink-0"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "var(--accent-button-bg)",
              boxShadow: "var(--accent-icon-shadow)",
            }}
          >
            <Rocket size={20} style={{ color: "var(--accent-button-text)" }} />
          </motion.div>
          {sidebarOpen && (
            <span
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: "var(--text-secondary)",
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.03em",
              }}
            >
              Omni<span style={{ color: "#4d7c0f" }}>Launch</span>
            </span>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav 
        className="px-4 pb-4 space-y-2 overflow-y-auto scrollbar-hide"
        style={{ marginTop: "24px" }}
      >
        <span 
          style={{ 
            display: sidebarOpen ? "block" : "none",
            padding: "0 12px 12px 12px", 
            fontSize: "10px", 
            fontWeight: 800, 
            color: "var(--text-muted)", 
            textTransform: "uppercase", 
            letterSpacing: "0.15em",
            opacity: 0.6
          }}
        >
          Menu
        </span>
        
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.href}
              onClick={() => handleNav(item.href)}
              whileHover={{ x: sidebarOpen ? 4 : 0 }}
              className="group w-full flex items-center relative"
              style={{
                height: "48px",
                padding: sidebarOpen ? "0 16px" : "0",
                justifyContent: sidebarOpen ? "flex-start" : "center",
                borderRadius: "14px",
                background: isActive ? "var(--bg-elevated)" : "transparent",
                border: isActive ? "1px solid var(--border-strong)" : "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: isActive ? "var(--shadow-md)" : "none"
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active-pill"
                  className="absolute left-0 w-1 rounded-full"
                  style={{
                    height: "24px",
                    background: "var(--accent-lime)",
                    boxShadow: "0 0 12px rgba(163, 230, 53, 0.8)",
                  }}
                />
              )}
              
              <Icon
                size={20}
                style={{
                  color: isActive ? "var(--accent-lime)" : "var(--text-muted)",
                  transition: "all 0.2s ease",
                }}
                className="group-hover:scale-110"
              />
              {sidebarOpen && (
                <span
                  style={{
                    marginLeft: "14px",
                    fontSize: "14px",
                    fontWeight: isActive ? 900 : 700,
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    transition: "all 0.2s ease",
                  }}
                  className="group-hover:text-white"
                >
                  {item.label}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>



    </div>
  );
}

/** Mobile overlay sidebar with backdrop and slide-in animation */
function MobileSidebar() {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useAppStore();

  // Close on Escape key (via global escape handler stack)
  useEscapeHandler(() => setMobileSidebarOpen(false), mobileSidebarOpen);

  return (
    <AnimatePresence>
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          />

          {/* Sidebar panel */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-0 left-0 h-full flex flex-col overflow-hidden"
            style={{
              width: "260px",
              background: "var(--bg-sidebar-glass)",
              backdropFilter: "blur(20px)",
              borderRight: "1px solid var(--border-subtle)",
            }}
          >
            <SidebarContent onNavClick={() => setMobileSidebarOpen(false)} />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Desktop sidebar — hidden on mobile */
function DesktopSidebar() {
  const { sidebarOpen } = useAppStore();

  return (
    <aside
      className="hidden md:flex flex-col overflow-hidden"
      style={{
        width: sidebarOpen ? "260px" : "72px",
        background: "var(--bg-sidebar-glass)",
        borderRight: "1px solid var(--border-subtle)",
        transition: "width 0.25s ease",
      }}
    >
      <SidebarContent />
    </aside>
  );
}

export default function Sidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
}
