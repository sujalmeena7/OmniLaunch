"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  AudioWaveform,
  Rocket,
  SlidersHorizontal,
  LayoutDashboard,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";
import type { VoiceProfile, LaunchBundle } from "@/types";

interface SearchResult {
  id: string;
  type: "bundle" | "voice" | "page";
  title: string;
  subtitle: string;
  icon: typeof Package;
  href: string;
}

const PAGES: SearchResult[] = [
  { id: "page-dashboard", type: "page", title: "Dashboard", subtitle: "Statistics overview", icon: LayoutDashboard, href: "/dashboard" },
  { id: "page-launch", type: "page", title: "Launch", subtitle: "Generate new bundle", icon: Rocket, href: "/dashboard/launch" },
  { id: "page-voice-lab", type: "page", title: "Voice Lab", subtitle: "Train voice profiles", icon: AudioWaveform, href: "/dashboard/voice-lab" },
  { id: "page-bundles", type: "page", title: "Bundles", subtitle: "View all launches", icon: Package, href: "/dashboard/bundles" },
  { id: "page-settings", type: "page", title: "Settings", subtitle: "Account preferences", icon: SlidersHorizontal, href: "/dashboard/settings" },
];

interface CommandPaletteProps {
  onClose: () => void;
}

export default function CommandPalette({ onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [bundles, setBundles] = useState<LaunchBundle[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const voiceProfiles = useAppStore((s) => s.voiceProfiles);

  // Fetch bundles when palette opens
  useEffect(() => {
    setLoading(true);
    api
      .listBundles()
      .then((data) => setBundles((data.bundles || []) as unknown as LaunchBundle[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Build search results
  const results: SearchResult[] = useMemo(() => {
    const q = query.toLowerCase().trim();

    const bundleResults: SearchResult[] = bundles
      .filter((b) => b.product_name?.toLowerCase().includes(q))
      .slice(0, 5)
      .map((b) => ({
        id: `bundle-${b.id}`,
        type: "bundle" as const,
        title: b.product_name,
        subtitle: `${b.status} · ${b.posts?.length || 0} posts`,
        icon: Package,
        href: `/dashboard/bundles/${b.id}`,
      }));

    const voiceResults: SearchResult[] = voiceProfiles
      .filter((v: VoiceProfile) => v.name?.toLowerCase().includes(q))
      .slice(0, 3)
      .map((v: VoiceProfile) => ({
        id: `voice-${v.id}`,
        type: "voice" as const,
        title: v.name,
        subtitle: `${Math.round(v.confidence * 100)}% confidence · ${v.sample_count} samples`,
        icon: AudioWaveform,
        href: "/dashboard/voice-lab",
      }));

    const pageResults = PAGES.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q)
    );

    if (!q) {
      return [...pageResults, ...bundleResults.slice(0, 3), ...voiceResults.slice(0, 2)];
    }

    return [...bundleResults, ...voiceResults, ...pageResults];
  }, [query, bundles, voiceProfiles]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results.length, query]);

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const navigate = useCallback(
    (result: SearchResult) => {
      onClose();
      router.push(result.href);
    },
    [router, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % Math.max(results.length, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + results.length) % Math.max(results.length, 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[activeIndex]) {
          navigate(results[activeIndex]);
        }
      }
    },
    [results, activeIndex, navigate]
  );

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 9998,
        }}
      />

      {/* Palette */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "560px",
          maxHeight: "420px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-strong)",
          borderRadius: "16px",
          boxShadow: "var(--shadow-lg)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center"
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            gap: "12px",
          }}
        >
          <Search size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search bundles, voices, pages..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-secondary)",
              fontSize: "15px",
              fontFamily: "var(--font-sans)",
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: "var(--bg-surface-hover)",
              border: "none",
              borderRadius: "6px",
              padding: "4px 8px",
              cursor: "pointer",
              fontSize: "11px",
              color: "var(--text-muted)",
              fontWeight: 600,
            }}
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px",
          }}
        >
          {loading && results.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              Loading...
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((result, i) => {
              const Icon = result.icon;
              const isActive = i === activeIndex;
              return (
                <button
                  key={result.id}
                  onClick={() => navigate(result)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className="flex items-center w-full text-left"
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "none",
                    background: isActive ? "var(--bg-surface-hover)" : "transparent",
                    cursor: "pointer",
                    gap: "12px",
                    fontFamily: "var(--font-sans)",
                    transition: "background 0.1s ease",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: isActive ? "var(--bg-elevated)" : "var(--bg-surface-hover)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} style={{ color: isActive ? "var(--accent-lime)" : "var(--text-muted)" }} />
                  </div>
                  <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>
                    <span
                      className="truncate"
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {result.title}
                    </span>
                    <span
                      className="truncate"
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {result.subtitle}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      opacity: 0.7,
                    }}
                  >
                    {result.type}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: "10px 20px",
            borderTop: "1px solid var(--border-subtle)",
            fontSize: "11px",
            color: "var(--text-muted)",
          }}
        >
          <div className="flex items-center" style={{ gap: "12px" }}>
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
          <span>{results.length} results</span>
        </div>
      </motion.div>
    </>
  );
}
