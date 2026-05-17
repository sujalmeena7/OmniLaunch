"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";
import type { UserProfile } from "@/types";
import { motion } from "framer-motion";
import { Eye, EyeOff, Rocket } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f9fafb",
        fontFamily: "var(--font-sans)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          padding: "40px 36px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
        }}
      >
        {/* Logo + Title */}
        <div style={{ marginBottom: "32px" }}>
          <div className="flex items-center" style={{ gap: "10px", marginBottom: "24px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--accent-lime)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Rocket size={18} style={{ color: "#0a0a0a" }} />
            </div>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>OmniLaunch</span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
            Create your account
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "8px", lineHeight: 1.5 }}>
            Start launching across platforms in minutes. Free to get started.
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-3" style={{ gap: "12px", marginBottom: "16px" }}>
          <button
            type="button"
            style={{
              height: "44px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              color: "#374151",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#d1d5db"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.79-.065-1.54-.18-2.27H12v4.3h6.6c-.285 1.54-1.155 2.84-2.46 3.72v3.09h3.975c2.325-2.14 3.66-5.29 3.66-8.84z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.955-1.075 7.935-2.91l-3.975-3.09c-1.11.745-2.52 1.185-3.96 1.185-3.045 0-5.625-2.055-6.555-4.81H1.41v3.13C3.39 21.5 7.425 24 12 24z" />
              <path fill="#FBBC05" d="M5.445 14.375c-.24-.71-.375-1.47-.375-2.25s.135-1.54.375-2.25V6.745H1.41C.51 8.525 0 10.51 0 12.625s.51 4.1 1.41 5.88l4.035-3.13z" />
              <path fill="#EA4335" d="M12 4.81c1.765 0 3.345.61 4.59 1.8l3.435-3.435C17.94 1.19 15.24 0 12 0 7.425 0 3.39 2.5 1.41 6.745l4.035 3.13c.93-2.755 3.51-4.81 12-4.81z" />
            </svg>
            Google
          </button>
          <button
            type="button"
            style={{
              height: "44px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              color: "#374151",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#d1d5db"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#000000">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.51 12.09 1.011 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.404-2.427 1.248-3.83-1.208.052-2.677.805-3.535 1.804-.78.895-1.454 2.336-1.273 3.712 1.338.104 2.715-.688 3.559-1.687z" />
            </svg>
            Apple
          </button>
          <button
            type="button"
            style={{
              height: "44px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              color: "#374151",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#d1d5db"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#24292f">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center" style={{ gap: "16px", margin: "24px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
          <span style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 400 }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Display Name */}
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              required
              style={{
                width: "100%",
                height: "44px",
                padding: "0 14px",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                color: "#111827",
                fontSize: "14px",
                fontFamily: "var(--font-sans)",
                outline: "none",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#a3e635"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(163, 230, 53, 0.1)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: "100%",
                height: "44px",
                padding: "0 14px",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                color: "#111827",
                fontSize: "14px",
                fontFamily: "var(--font-sans)",
                outline: "none",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#a3e635"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(163, 230, 53, 0.1)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                minLength={8}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 44px 0 14px",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  color: "#111827",
                  fontSize: "14px",
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#a3e635"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(163, 230, 53, 0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "13px" }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "44px",
              borderRadius: "10px",
              border: "none",
              background: "var(--accent-lime)",
              color: "#0f1a4a",
              fontSize: "15px",
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.opacity = "1"; }}
          >
            {loading ? "Creating account..." : "Get Started"}
          </button>
        </form>

        {/* Login link */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <span style={{ fontSize: "14px", color: "#6b7280" }}>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              style={{
                background: "none",
                border: "none",
                color: "#111827",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "14px",
                fontFamily: "var(--font-sans)",
                textDecoration: "underline",
                textUnderlineOffset: "2px",
              }}
            >
              Log in
            </button>
          </span>
        </div>
      </motion.div>

      {/* Footer */}
      <div style={{ marginTop: "24px", textAlign: "center" }}>
        <span style={{ fontSize: "12px", color: "#9ca3af" }}>
          By continuing, I agree to OmniLaunch&apos;s{" "}
          <span style={{ textDecoration: "underline", cursor: "pointer" }}>terms</span>,{" "}
          <span style={{ textDecoration: "underline", cursor: "pointer" }}>privacy policy</span>, and{" "}
          <span style={{ textDecoration: "underline", cursor: "pointer" }}>cookie policy</span>.
        </span>
      </div>
    </motion.div>
  );
}
