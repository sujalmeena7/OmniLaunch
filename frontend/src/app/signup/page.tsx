"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";
import type { UserProfile } from "@/types";
import { motion } from "framer-motion";
import { Mail, Lock, User, Rocket } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.signup(email, password, displayName);
      setUser(data.user as unknown as UserProfile);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="dashboard-landing-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          maxWidth: "460px",
          width: "100%",
          padding: "48px 40px",
          borderRadius: "48px",
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow: "0 20px 60px -15px rgba(0, 0, 0, 0.08)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Top Icon Area */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "18px",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "32px",
            boxShadow: "0 10px 20px -5px rgba(0,0,0,0.06)",
            border: "1px solid #f1f5f9",
          }}
        >
          <Rocket size={24} style={{ color: "#1e293b" }} />
        </div>

        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>
          Join OmniVision
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "40px", lineHeight: 1.5, maxWidth: "300px" }}>
          Launch your product across multiple platforms with high-fidelity writing DNA.
        </p>

        <form onSubmit={handleSignup} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Name Field */}
          <div style={{ position: "relative" }}>
            <User size={16} style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display Name"
              required
              style={{
                width: "100%",
                height: "52px",
                padding: "0 18px 0 48px",
                borderRadius: "9999px",
                border: "none",
                background: "#f1f5f9",
                color: "#1e293b",
                fontSize: "14px",
                fontWeight: 500,
                outline: "none",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>

          {/* Email Field */}
          <div style={{ position: "relative" }}>
            <Mail size={16} style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              style={{
                width: "100%",
                height: "52px",
                padding: "0 18px 0 48px",
                borderRadius: "9999px",
                border: "none",
                background: "#f1f5f9",
                color: "#1e293b",
                fontSize: "14px",
                fontWeight: 500,
                outline: "none",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ position: "relative" }}>
            <Lock size={16} style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 characters)"
              required
              minLength={8}
              style={{
                width: "100%",
                height: "52px",
                padding: "0 18px 0 48px",
                borderRadius: "9999px",
                border: "none",
                background: "#f1f5f9",
                color: "#1e293b",
                fontSize: "14px",
                fontWeight: 500,
                outline: "none",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "14px", background: "rgba(250, 82, 82, 0.05)", border: "1px solid rgba(250, 82, 82, 0.1)", color: "#fa5252", fontSize: "13px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "56px",
              marginTop: "16px",
              borderRadius: "9999px",
              border: "none",
              background: "#1e293b",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 10px 20px -5px rgba(0,0,0,0.2)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#0f172a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#1e293b")}
          >
            {loading ? "Preparing Launch..." : "Get Started Now"}
          </button>
        </form>

        {/* Social Login Section */}
        <div style={{ width: "100%", marginTop: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0", borderStyle: "dashed" }} />
            <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Or join with
            </span>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0", borderStyle: "dashed" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <button
              style={{
                height: "48px",
                borderRadius: "14px",
                border: "1px solid #f1f5f9",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.79-.065-1.54-.18-2.27H12v4.3h6.6c-.285 1.54-1.155 2.84-2.46 3.72v3.09h3.975c2.325-2.14 3.66-5.29 3.66-8.84z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.955-1.075 7.935-2.91l-3.975-3.09c-1.11.745-2.52 1.185-3.96 1.185-3.045 0-5.625-2.055-6.555-4.81H1.41v3.13C3.39 21.5 7.425 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.445 14.375c-.24-.71-.375-1.47-.375-2.25s.135-1.54.375-2.25V6.745H1.41C.51 8.525 0 10.51 0 12.625s.51 4.1 1.41 5.88l4.035-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.81c1.765 0 3.345.61 4.59 1.8l3.435-3.435C17.94 1.19 15.24 0 12 0 7.425 0 3.39 2.5 1.41 6.745l4.035 3.13c.93-2.755 3.51-4.81 12-4.81z"
                />
              </svg>
            </button>
            <button
              style={{
                height: "48px",
                borderRadius: "14px",
                border: "1px solid #f1f5f9",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <button
              style={{
                height: "48px",
                borderRadius: "14px",
                border: "1px solid #f1f5f9",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.51 12.09 1.011 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.404-2.427 1.248-3.83-1.208.052-2.677.805-3.535 1.804-.78.895-1.454 2.336-1.273 3.712 1.338.104 2.715-.688 3.559-1.687z" />
              </svg>
            </button>
          </div>
        </div>

        <p style={{ marginTop: "40px", fontSize: "14px", color: "#64748b" }}>
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            style={{ background: "none", border: "none", color: "#1e293b", fontWeight: 700, cursor: "pointer", padding: 0 }}
          >
            Log in
          </button>
        </p>
      </motion.div>
    </div>
  );
}
