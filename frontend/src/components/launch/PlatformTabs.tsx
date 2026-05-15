/* ============================================================
   OmniLaunch — Platform Tabs (Underline Style)
   ============================================================ */

"use client";

import { useAppStore } from "@/stores/appStore";
import type { GeneratedPost } from "@/types";

interface PlatformTabsProps {
  posts: GeneratedPost[];
  activeTab: number;
  onTabChange: (index: number) => void;
}

function toSentenceCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PlatformTabs({
  posts,
  activeTab,
  onTabChange,
}: PlatformTabsProps) {
  const { editedPosts } = useAppStore();

  return (
    <div
      className="flex flex-shrink-0 overflow-x-auto md:overflow-x-visible scrollbar-hide flex-nowrap"
      style={{
        height: "40px",
        borderBottom: "1px solid var(--border-subtle)",
        gap: "4px",
        padding: "0 24px",
        alignItems: "center",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {posts.map((post, i) => {
        const isActive = activeTab === i;
        const isEdited = !!editedPosts[post.id];
        const label = toSentenceCase(post.sub_target || post.platform);

        return (
          <button
            key={post.id}
            onClick={() => onTabChange(i)}
            className="relative flex items-center"
            style={{
              height: "40px",
              padding: "0 12px",
              fontSize: "13px",
              fontWeight: 500,
              color: isActive ? "var(--text-secondary)" : "var(--text-muted)",
              background: "none",
              border: "none",
              borderBottom: isActive ? "2px solid var(--text-secondary)" : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            {label}
            {isEdited && (
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "2px",
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "var(--accent-amber)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
