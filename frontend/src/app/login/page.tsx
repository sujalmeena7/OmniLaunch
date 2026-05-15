"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";
import type { UserProfile } from "@/types";
import { motion } from "framer-motion";
import { Mail, Lock, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.login(email, password);
      setUser(data.user as unknown as UserProfile);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        backgroundImage: "url('https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?q=80&w=2574&auto=format&fit=crop')",
        backgroundSize: "cover",
        backgroundPosition: "center bottom",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(24px)" }} />
      
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
         <div style={{ position: "absolute", top: "50%", left: "50%", width: "140vw", height: "140vw", transform: "translate(-50%, -50%)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.4)" }} />
         <div style={{ position: "absolute", top: "50%", left: "50%", width: "100vw", height: "100vw", transform: "translate(-50%, -50%)", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "460px",
          width: "100%",
          padding: "36px 40px 32px 40px",
          borderRadius: "32px",
          background: "linear-gradient(180deg, #eaf6ff 0%, #ffffff 25%, #ffffff 100%)",
          boxShadow: "0 24px 80px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.8) inset",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <div style={{ position: "absolute", inset: 0, background: "#00a2ff", filter: "blur(20px)", opacity: 0.35, transform: "translateY(8px) scale(0.9)" }} />
          <div
            style={{
              position: "relative",
              width: "56px",
              height: "56px",
              borderRadius: "18px",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)",
            }}
          >
            <LogIn size={26} strokeWidth={2} style={{ color: "#000", transform: "translateX(2px)" }} />
          </div>
        </div>

        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#000000", marginBottom: "6px", letterSpacing: "-0.02em" }}>
          Sign in with email
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px", lineHeight: 1.5, maxWidth: "320px" }}>
          Make a new doc to bring your words, data, and teams together. For free
        </p>

        <form onSubmit={handleLogin} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ position: "relative" }}>
            <Mail size={16} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#8a93a1" }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              style={{
                width: "100%",
                height: "46px",
                padding: "0 16px 0 44px",
                borderRadius: "12px",
                border: "none",
                background: "#f4f5f7",
                color: "#111827",
                fontSize: "14px",
                fontWeight: 500,
                outline: "none",
                fontFamily: "var(--font-sans)",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,0,0,0.05)"; }}
              onBlur={(e) => { e.currentTarget.style.background = "#f4f5f7"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          <div style={{ position: "relative" }}>
            <Lock size={16} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#8a93a1" }} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={{
                width: "100%",
                height: "46px",
                padding: "0 44px 0 44px",
                borderRadius: "12px",
                border: "none",
                background: "#f4f5f7",
                color: "#111827",
                fontSize: "14px",
                fontWeight: 500,
                outline: "none",
                fontFamily: "var(--font-sans)",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,0,0,0.05)"; }}
              onBlur={(e) => { e.currentTarget.style.background = "#f4f5f7"; e.currentTarget.style.boxShadow = "none"; }}
            />
            <EyeOff size={16} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", color: "#8a93a1", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color="#111827"} onMouseLeave={(e) => e.currentTarget.style.color="#8a93a1"} />
          </div>

          <div style={{ textAlign: "right", marginTop: "2px" }}>
            <button
              type="button"
              style={{ background: "none", border: "none", fontSize: "12px", color: "#000000", fontWeight: 500, cursor: "pointer", transition: "opacity 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity="0.7"}
              onMouseLeave={(e) => e.currentTarget.style.opacity="1"}
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <div style={{ padding: "8px 12px", borderRadius: "10px", background: "rgba(254, 226, 226, 0.5)", color: "#dc2626", fontSize: "12px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "46px",
              marginTop: "4px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(180deg, #333333 0%, #1a1a1a 100%)",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"; }}
          >
            {loading ? "Signing in..." : "Get Started"}
          </button>
        </form>

        <div style={{ 
          width: "calc(100% + 80px)", 
          marginTop: "24px", 
          marginBottom: "-32px",
          marginLeft: "-40px",
          marginRight: "-40px",
          padding: "24px 40px 32px",
          background: "#111827",
          borderBottomLeftRadius: "32px",
          borderBottomRightRadius: "32px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ flex: 1, borderTop: "1px dashed rgba(255,255,255,0.15)" }} />
            <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500 }}>
              Or sign in with
            </span>
            <div style={{ flex: 1, borderTop: "1px dashed rgba(255,255,255,0.15)" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <button
              style={{
                height: "44px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.79-.065-1.54-.18-2.27H12v4.3h6.6c-.285 1.54-1.155 2.84-2.46 3.72v3.09h3.975c2.325-2.14 3.66-5.29 3.66-8.84z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.955-1.075 7.935-2.91l-3.975-3.09c-1.11.745-2.52 1.185-3.96 1.185-3.045 0-5.625-2.055-6.555-4.81H1.41v3.13C3.39 21.5 7.425 24 12 24z" />
                <path fill="#FBBC05" d="M5.445 14.375c-.24-.71-.375-1.47-.375-2.25s.135-1.54.375-2.25V6.745H1.41C.51 8.525 0 10.51 0 12.625s.51 4.1 1.41 5.88l4.035-3.13z" />
                <path fill="#EA4335" d="M12 4.81c1.765 0 3.345.61 4.59 1.8l3.435-3.435C17.94 1.19 15.24 0 12 0 7.425 0 3.39 2.5 1.41 6.745l4.035 3.13c.93-2.755 3.51-4.81 12-4.81z" />
              </svg>
            </button>
            <button
              style={{
                height: "44px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <button
              style={{
                height: "44px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.51 12.09 1.011 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.404-2.427 1.248-3.83-1.208.052-2.677.805-3.535 1.804-.78.895-1.454 2.336-1.273 3.712 1.338.104 2.715-.688 3.559-1.687z" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
