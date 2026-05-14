"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";
import PlatformTabs from "@/components/launch/PlatformTabs";
import PostPreview from "@/components/launch/PostPreview";
import ValidationGutter from "@/components/launch/ValidationGutter";
import type { GeneratedPost, PlatformRule } from "@/types";

interface BundleData {
  id: string;
  product_name: string;
  status: string;
  posts: GeneratedPost[];
  created_at: string;
  completed_at: string | null;
}

export default function BundleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { editedPosts, updatePost, platformRules, setPlatformRules } = useAppStore();

  const [bundle, setBundle] = useState<BundleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    // Load platform rules if not already cached
    if (platformRules.length === 0) {
      api.listPlatforms()
        .then((data) => setPlatformRules((data.platforms || []) as unknown as PlatformRule[]))
        .catch(() => {});
    }
  }, [platformRules.length, setPlatformRules]);

  useEffect(() => {
    if (params.id) {
      api
        .getBundle(params.id as string)
        .then((data) => setBundle(data as unknown as BundleData))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  const displayPosts: GeneratedPost[] = (bundle?.posts || []).map((p) => ({
    ...p,
    ...editedPosts[p.id],
  }));

  const activePost = displayPosts[activeTab] ?? null;

  const handleEdit = useCallback(
    (postId: string, changes: Partial<GeneratedPost>) => {
      if (!bundle) return;
      updatePost(bundle.id, postId, changes);
    },
    [bundle, updatePost]
  );

  const handleRegenerate = useCallback(
    (postId: string) => {
      if (!bundle) return;
      // Refresh bundle to get updated post data from server
      api.getBundle(bundle.id).then((data) => {
        setBundle(data as unknown as BundleData);
      }).catch(() => {});
    },
    [bundle]
  );

  if (loading) {
    return <div style={{ color: "var(--text-muted)" }}>Loading bundle...</div>;
  }

  if (!bundle) {
    return (
      <div style={{ textAlign: "center", padding: "48px" }}>
        <p style={{ color: "var(--text-secondary)" }}>Bundle not found.</p>
        <button
          onClick={() => router.push("/dashboard/bundles")}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-default)",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
          }}
        >
          ← Back to Bundles
        </button>
      </div>
    );
  }

  const isComplete = bundle.status === "complete";

  return (
    <div style={{ maxWidth: "960px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <button
            onClick={() => router.push("/dashboard/bundles")}
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              marginBottom: "8px",
              fontFamily: "var(--font-sans)",
            }}
          >
            ← Back to Bundles
          </button>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>{bundle.product_name}</h1>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              marginTop: "4px",
            }}
          >
            Created {new Date(bundle.created_at).toLocaleString()} · {bundle.posts.length} posts
          </p>
        </div>
        <span
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            fontSize: "13px",
            fontWeight: 500,
            background:
              bundle.status === "complete"
                ? "rgba(64, 192, 87, 0.1)"
                : "rgba(250, 176, 5, 0.1)",
            color:
              bundle.status === "complete"
                ? "var(--accent-green)"
                : "var(--accent-amber)",
            border: `1px solid ${
              bundle.status === "complete"
                ? "rgba(64, 192, 87, 0.3)"
                : "rgba(250, 176, 5, 0.3)"
            }`,
          }}
        >
          {bundle.status}
        </span>
      </div>

      {bundle.posts.length === 0 ? (
        <div
          style={{
            padding: "48px",
            textAlign: "center",
            borderRadius: "var(--radius-lg)",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            {bundle.status === "pending" || bundle.status === "generating"
              ? "Posts are being generated... Check back soon."
              : "No posts generated for this bundle."}
          </p>
        </div>
      ) : (
        <>
          <PlatformTabs
            posts={displayPosts}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {activePost && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 280px",
                gap: "16px",
              }}
            >
              <PostPreview
                post={activePost}
                bundleId={bundle.id}
                platformRules={platformRules}
                onEdit={handleEdit}
                onRegenerate={handleRegenerate}
                isComplete={isComplete}
              />
              <ValidationGutter
                checks={activePost.rule_checks}
                voiceMatchScore={activePost.voice_match_score}
                aiIsmsRemoved={activePost.ai_isms_removed}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
