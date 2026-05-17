"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";
import type { UserProfile } from "@/types";

/**
 * OAuth callback page.
 * After Google/GitHub redirects back, Supabase sets the session in the URL hash.
 * This page extracts the session, stores the token, and redirects to dashboard.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically picks up the session from the URL hash
        const { data, error: authError } = await supabase.auth.getSession();

        if (authError || !data.session) {
          setError(authError?.message || "Authentication failed");
          setTimeout(() => router.push("/login"), 2000);
          return;
        }

        // Store the access token for our API
        const token = data.session.access_token;
        api.setToken(token);

        if (data.session.refresh_token) {
          localStorage.setItem("omnilaunch_refresh", data.session.refresh_token);
        }

        // Fetch user profile from our backend
        try {
          const userData = await api.getMe();
          setUser(userData as unknown as UserProfile);
        } catch {
          // Profile might not exist yet for new OAuth users — backend should auto-create
          // Try once more after a short delay
          await new Promise((r) => setTimeout(r, 1000));
          const userData = await api.getMe();
          setUser(userData as unknown as UserProfile);
        }

        router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setTimeout(() => router.push("/login"), 2000);
      }
    };

    handleCallback();
  }, [router, setUser]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        {error ? (
          <>
            <p style={{ color: "#dc2626", fontSize: "14px", marginBottom: "8px" }}>{error}</p>
            <p style={{ color: "#6b7280", fontSize: "13px" }}>Redirecting to login...</p>
          </>
        ) : (
          <>
            <div
              className="w-8 h-8 border-4 border-[var(--accent-lime)] border-t-transparent rounded-full animate-spin"
              style={{ margin: "0 auto 16px" }}
            />
            <p style={{ color: "#374151", fontSize: "14px", fontWeight: 500 }}>Signing you in...</p>
          </>
        )}
      </div>
    </div>
  );
}
