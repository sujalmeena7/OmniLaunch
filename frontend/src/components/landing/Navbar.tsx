"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, ChevronDown, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Voice Lab", href: "/dashboard/voice-lab" },
  { label: "Docs", href: "#" },
];

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMenuOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(href);
    }
  };

  return (
    <>
      {/* Main navbar */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "64px",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(6, 11, 46, 0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          transition: "background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
          fontFamily: "var(--font-sans)",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{ width: "100%", maxWidth: "1100px", padding: "0 24px" }}
        >
          {/* Logo */}
          <button
            suppressHydrationWarning
            onClick={() => router.push("/")}
            className="flex items-center"
            style={{ gap: "10px", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "var(--accent-lime)",
              }}
            >
              <Rocket size={15} style={{ color: "#0a0a0a" }} />
            </div>
            <span
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#ffffff",
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.02em",
              }}
            >
              OmniLaunch
            </span>
          </button>

          {/* Desktop center nav */}
          <div className="hidden lg:flex items-center" style={{ gap: "32px", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                suppressHydrationWarning
                onClick={() => handleNav(link.href)}
                className="flex items-center"
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#ffffff",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 0",
                  fontFamily: "var(--font-sans)",
                  transition: "opacity 0.2s ease",
                  gap: "4px",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.75"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                {link.label}
                {link.label === "Features" && <ChevronDown size={14} style={{ opacity: 0.5 }} />}
              </button>
            ))}
          </div>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center" style={{ gap: "10px", flexShrink: 0 }}>
            <button
              suppressHydrationWarning
              onClick={() => router.push("/signup")}
              style={{
                height: "38px",
                padding: "0 18px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#0a0a0a",
                background: "var(--accent-lime)",
                border: "none",
                borderRadius: "9999px",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "opacity 0.15s ease, transform 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Start a Free
            </button>
            <button
              suppressHydrationWarning
              onClick={() => router.push("/dashboard/launch")}
              style={{
                height: "38px",
                padding: "0 18px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#ffffff",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.30)",
                borderRadius: "9999px",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "border-color 0.15s ease, background 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.50)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.30)"; e.currentTarget.style.background = "transparent"; }}
            >
              Book a Demo
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            suppressHydrationWarning
            className="md:hidden flex items-center justify-center"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: "36px",
              height: "36px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#ffffff",
            }}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex flex-col md:hidden"
            style={{
              background: "rgba(6, 13, 26, 0.98)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              zIndex: 99,
              paddingTop: "64px",
            }}
          >
            <div className="flex flex-col items-center" style={{ gap: "24px", padding: "40px 24px" }}>
              {NAV_LINKS.map((link, i) => (
                <motion.button
                  key={link.label}
                  suppressHydrationWarning
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 + 0.1 }}
                  onClick={() => handleNav(link.href)}
                  style={{
                    fontSize: "20px",
                    fontWeight: 500,
                    color: "#ffffff",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {link.label}
                </motion.button>
              ))}
              <div className="flex flex-col items-center" style={{ gap: "12px", marginTop: "24px", width: "100%", maxWidth: "280px" }}>
                <motion.button
                  suppressHydrationWarning
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => { setMenuOpen(false); router.push("/signup"); }}
                  style={{
                    width: "100%",
                    height: "48px",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#0a0a0a",
                    background: "var(--accent-lime)",
                    border: "none",
                    borderRadius: "9999px",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Start a Free
                </motion.button>
                <motion.button
                  suppressHydrationWarning
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  onClick={() => { setMenuOpen(false); router.push("/dashboard/launch"); }}
                  style={{
                    width: "100%",
                    height: "48px",
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "#ffffff",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "9999px",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Book a Demo
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
