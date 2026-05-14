"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PLATFORM_META } from "@/types";

interface BundleSummary {
  id: string;
  product_name: string;
  product_description: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export default function BundlesPage() {
  const router = useRouter();
  const [bundles, setBundles] = useState<BundleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listBundles()
      .then((data) => setBundles((data.bundles || []) as unknown as BundleSummary[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    complete: "var(--accent-green)",
    generating: "var(--accent-amber)",
    pending: "var(--text-muted)",
    failed: "var(--accent-red)",
  };

  return (
    <div style={{ maxWidth: "800px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>📦 Launch Bundles</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
        All your generated launch bundles in one place.
      </p>

      {loading ? (
        <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</div>
      ) : bundles.length === 0 ? (
        <div
          style={{
            padding: "48px",
            borderRadius: "var(--radius-lg)",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "48px", display: "block", marginBottom: "12px" }}>📦</span>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>
            No bundles yet. Generate your first launch bundle!
          </p>
          <button
            onClick={() => router.push("/dashboard/launch")}
            style={{
              padding: "10px 24px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: "var(--gradient-brand)",
              color: "white",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Create Launch Bundle
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {bundles.map((bundle) => (
            <button
              key={bundle.id}
              onClick={() => router.push(`/dashboard/bundles/${bundle.id}`)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderRadius: "var(--radius-lg)",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                cursor: "pointer",
                transition: "all 0.15s",
                width: "100%",
                textAlign: "left",
                fontFamily: "var(--font-sans)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  {bundle.product_name}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {bundle.product_description?.slice(0, 80)}
                  {(bundle.product_description?.length || 0) > 80 ? "..." : ""}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  {new Date(bundle.created_at).toLocaleDateString()} · {new Date(bundle.created_at).toLocaleTimeString()}
                </div>
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  padding: "4px 12px",
                  borderRadius: "var(--radius-full)",
                  background: `${statusColors[bundle.status] || "var(--text-muted)"}20`,
                  color: statusColors[bundle.status] || "var(--text-muted)",
                  flexShrink: 0,
                }}
              >
                {bundle.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
