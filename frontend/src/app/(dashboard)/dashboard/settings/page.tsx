"use client";

import { useAppStore } from "@/stores/appStore";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAppStore();

  const handleLogout = () => {
    logout();
    api.clearToken();
    router.push("/login");
  };

  return (
    <div style={{ maxWidth: "600px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>⚙️ Settings</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px" }}>
        Manage your account and preferences.
      </p>

      {/* Profile section */}
      <div
        style={{
          padding: "24px",
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          marginBottom: "16px",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Profile</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Name</span>
            <span>{user?.display_name || "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Email</span>
            <span>{user?.email || "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Plan</span>
            <span style={{ color: "var(--brand-400)", fontWeight: 600 }}>{user?.plan || "free"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Launches Remaining</span>
            <span>{user?.launches_remaining ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Plan section */}
      <div
        style={{
          padding: "24px",
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          marginBottom: "16px",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Subscription</h2>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
          You&apos;re on the <strong style={{ color: "var(--brand-400)" }}>{user?.plan || "free"}</strong> plan.
          {user?.plan === "free" && " Upgrade to Pro for unlimited launches."}
        </p>
        {user?.plan === "free" && (
          <button
            style={{
              padding: "10px 20px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: "var(--gradient-brand)",
              color: "white",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Upgrade to Pro
          </button>
        )}
      </div>

      {/* Danger zone */}
      <div
        style={{
          padding: "24px",
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-secondary)",
          border: "1px solid rgba(250, 82, 82, 0.2)",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", color: "var(--accent-red)" }}>Danger Zone</h2>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(250, 82, 82, 0.3)",
            background: "rgba(250, 82, 82, 0.1)",
            color: "var(--accent-red)",
            fontWeight: 500,
            fontSize: "13px",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
