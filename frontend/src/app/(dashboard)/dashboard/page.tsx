"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { motion } from "framer-motion";
import {
  Download,
  ArrowUpRight,
  Activity,
  Rocket,
} from "lucide-react";
import LaunchRow from "@/components/dashboard/LaunchRow";
import EmptyLaunches from "@/components/dashboard/EmptyLaunches";
import { DashboardSkeleton } from "@/components/ui/skeletons";

interface BundleSummary {
  id: string;
  product_name: string;
  status: string;
  created_at: string;
  product_description?: string;
  posts_count?: number;
}

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/* ── Card Wrapper ───────────────────────────────────────────── */
function Card({
  children,
  style,
  className = "",
  lime = false,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  lime?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col ${className}`}
      style={{
        background: lime 
          ? "linear-gradient(135deg, #C0FF33 0%, #D4F542 100%)" 
          : "var(--bg-card-glass)",
        backdropFilter: "blur(12px)",
        border: "1px solid",
        borderColor: lime ? "rgba(255, 255, 255, 0.2)" : "var(--border-card)",
        borderRadius: "24px",
        padding: "24px",
        cursor: "default",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: lime
          ? "0 10px 30px -10px rgba(192, 255, 51, 0.4)"
          : "var(--shadow-md)",
        ...style,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLElement).style.borderColor = lime 
          ? "rgba(255, 255, 255, 0.4)" 
          : "var(--border-strong)";
        if (!lime) (e.currentTarget as HTMLElement).style.background = "var(--bg-card-glass-hover)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.borderColor = lime 
          ? "rgba(255, 255, 255, 0.2)" 
          : "var(--border-card)";
        if (!lime) (e.currentTarget as HTMLElement).style.background = "var(--bg-card-glass)";
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Launch Overview Card (lime) ────────────────────────────── */
function LaunchOverviewCard({ total, remaining }: { total: number; remaining: number }) {
  const max = Math.max(total + remaining, 1);
  const pct = Math.min((total / max) * 100, 100);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <Card lime className="relative overflow-hidden">
      <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
        <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(15, 26, 74, 0.6)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Subscription Status</span>
        <div style={{ padding: "4px 8px", borderRadius: "6px", background: "rgba(15, 26, 74, 0.1)", fontSize: "10px", fontWeight: 700, color: "#0f1a4a" }}>PRO</div>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div style={{ position: "relative", width: "70px", height: "70px" }}>
          <svg width="70" height="70" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="35" cy="35" r={radius} fill="none" stroke="rgba(15,26,74,0.1)" strokeWidth="6" />
            <motion.circle
              cx="35"
              cy="35"
              r={radius}
              fill="none"
              stroke="#0f1a4a"
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.5, ease: "circOut" }}
              style={{ strokeDasharray: circumference }}
            />
          </svg>
          <div
            className="flex flex-col items-center justify-center"
            style={{ position: "absolute", inset: 0, lineHeight: 1 }}
          >
            <span style={{ fontSize: "18px", fontWeight: 800, color: "#0f1a4a" }}>{total}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1">
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f1a4a", letterSpacing: "-0.02em" }}>{total} Launches</div>
          <div style={{ fontSize: "12px", color: "rgba(15, 26, 74, 0.6)", fontWeight: 500 }}>
            {remaining} remaining this month
          </div>
        </div>
      </div>

      <div style={{ marginTop: "24px", height: "4px", borderRadius: "2px", background: "rgba(15, 26, 74, 0.1)", overflow: "hidden" }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ height: "100%", background: "#0f1a4a" }} 
        />
      </div>
    </Card>
  );
}

/* ── Voice Profile Card ─────────────────────────────────────── */
function VoiceProfileCard() {
  return (
    <Card style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "relative", zIndex: 1 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Voice DNA Status</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--accent-lime)" }}>ACTIVE</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center py-4">
            <div className="flex items-end gap-1 h-12">
              {[0.4, 0.7, 0.5, 0.9, 0.6, 1, 0.8, 0.5, 0.7, 0.4].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 4 }}
                  animate={{ height: h * 40 }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: Infinity, 
                    repeatType: "mirror", 
                    delay: i * 0.1,
                    ease: "easeInOut"
                  }}
                  style={{ width: "4px", background: "var(--text-muted)", borderRadius: "2px", opacity: 0.3 + (h * 0.7) }}
                />
              ))}
            </div>
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-secondary)", letterSpacing: "-0.02em" }}>My Voice</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>77% Alignment</div>
            </div>
            <button
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "12px",
                background: "var(--bg-surface-hover)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-secondary)",
                cursor: "pointer"
              }}
            >
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Background Glow */}
      <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "60%", height: "60%", background: "radial-gradient(circle, rgba(92, 124, 250, 0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />
    </Card>
  );
}

/* ── Platform Activity Card ───────────────────────────────────── */
function PlatformActivityCard({ bundles }: { bundles: BundleSummary[] }) {
  // Show actual platforms the app supports with post counts from bundles
  const totalPosts = bundles.reduce((sum, b) => sum + (b.posts_count || 0), 0);
  
  // These are the actual platforms OmniLaunch generates for
  const platformConfig = [
    { label: "Hacker News", color: "#ff6600" },
    { label: "Product Hunt", color: "#da552f" },
    { label: "Reddit", color: "#ff4500" },
    { label: "IndieHackers", color: "#0e6db4" },
    { label: "Twitter / X", color: "#1da1f2" },
  ];

  // Distribute posts roughly across platforms (each bundle generates for selected platforms)
  const postsPerPlatform = totalPosts > 0 ? Math.ceil(totalPosts / platformConfig.length) : 0;
  const maxPosts = Math.max(postsPerPlatform, 1);

  const platforms = platformConfig.map((p) => ({
    ...p,
    count: postsPerPlatform,
    pct: totalPosts > 0 ? Math.round((postsPerPlatform / maxPosts) * 100) : 0,
  }));

  return (
    <Card>
      <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
        <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Platform Activity</span>
        <Activity size={14} style={{ color: "var(--text-muted)" }} />
      </div>

      <div className="flex flex-col gap-4">
        {platforms.map((p) => (
          <div key={p.label} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>{p.label}</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{p.count} posts</span>
            </div>
            <div style={{ height: "6px", background: "var(--bg-surface-hover)", borderRadius: "3px", overflow: "hidden" }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${p.pct}%` }}
                transition={{ duration: 1.2, ease: "circOut" }}
                style={{ height: "100%", background: p.color, borderRadius: "3px" }} 
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Voice Match Score Card ─────────────────────────────────── */
function VoiceMatchCard() {
  const points = [40, 55, 48, 65, 58, 72, 68, 85, 78, 94];
  
  return (
    <Card>
      <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
        <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Matching Engine</span>
        <Activity size={14} style={{ color: "var(--accent-lime)" }} />
      </div>

      <div className="flex items-baseline gap-2">
        <span style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-secondary)", letterSpacing: "-0.02em" }}>94%</span>
        <span style={{ fontSize: "12px", color: "var(--accent-lime)", fontWeight: 600 }}>+2.4%</span>
      </div>
      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "24px" }}>Average cross-platform match</div>

      <div className="flex items-end gap-1" style={{ height: "40px" }}>
        {points.map((p, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${(p / 100) * 40}px` }}
            transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
            style={{ 
              flex: 1, 
              background: i === points.length - 1 ? "var(--accent-lime)" : "var(--bg-surface-hover)", 
              borderRadius: "2px 2px 0 0" 
            }}
          />
        ))}
      </div>
    </Card>
  );
}

/* ── Feature Highlight Card ─────────────────────────────────── */
function FeatureHighlightCard() {
  return (
    <Card style={{ position: "relative", overflow: "hidden", padding: 0, height: "100%" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #0a1840 0%, #122462 100%)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          position: "relative",
          minHeight: "220px"
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: "20px", position: "relative", zIndex: 2 }}>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Next-Gen Tooling</span>
          <Rocket size={14} style={{ color: "var(--accent-lime)" }} />
        </div>

        <div className="flex-1 flex flex-col justify-center gap-4" style={{ position: "relative", zIndex: 2 }}>
           <div className="flex flex-col gap-2">
              <div style={{ height: "8px", width: "60%", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }} />
              <div style={{ height: "8px", width: "90%", background: "rgba(255,255,255,0.06)", borderRadius: "4px" }} />
              <div style={{ height: "8px", width: "40%", background: "rgba(255,255,255,0.08)", borderRadius: "4px" }} />
           </div>
           
           <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", fontWeight: 500, lineHeight: 1.4 }}>
             Generate high-converting <span style={{ color: "var(--accent-lime)" }}>LinkedIn posts</span> using your cloned voice DNA.
           </div>
        </div>

        <div style={{ position: "relative", zIndex: 2, marginTop: "auto" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "6px 14px",
              borderRadius: "10px",
              background: "var(--accent-lime)",
              color: "#0f1a4a",
              fontSize: "12px",
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(163, 230, 53, 0.3)"
            }}
          >
            AI Writing Assistant
          </div>
        </div>

        {/* Abstract Background Elements */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            right: "-10%",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(163, 230, 53, 0.05) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20px",
            right: "-20px",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(92, 124, 250, 0.1) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />
      </div>
    </Card>
  );
}

/* ── Platform Breakdown Card ────────────────────────────────── */
function PlatformBreakdownCard() {
  const channels = [
    { label: "B2B", val: 45, color: "var(--brand-400)" },
    { label: "Social", val: 32, color: "var(--accent-lime)" },
    { label: "Blog", val: 23, color: "var(--accent-purple)" },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
        <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Channel Distribution</span>
        <div style={{ padding: "4px 8px", borderRadius: "6px", background: "var(--bg-surface-hover)", fontSize: "10px", fontWeight: 600, color: "var(--text-muted)" }}>Last 30d</div>
      </div>

      <div className="flex items-center justify-center py-2">
        <div className="flex h-4 w-full rounded-full overflow-hidden bg-white/5">
          {channels.map((c, i) => (
            <motion.div
              key={i}
              initial={{ width: 0 }}
              animate={{ width: `${c.val}%` }}
              transition={{ duration: 1, delay: i * 0.1 }}
              style={{ background: c.color, height: "100%" }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-6">
        {channels.map((c) => (
          <div key={c.label} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>{c.label}</span>
            </div>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)" }}>{c.val}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

export default function DashboardHome() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);

  // Use cached query — serves stale data instantly on re-navigation, revalidates in background
  const { data: bundlesData, isLoading: loading } = useCachedQuery(
    "dashboard-bundles",
    () => api.listBundles().then((data) => (data.bundles || []) as unknown as BundleSummary[]),
    { staleTime: 30_000, cacheTime: 300_000 }
  );

  const bundles = bundlesData || [];

  const totalLaunches = bundles.length;
  const remaining = user?.launches_remaining ?? 0;
  const recentBundles = bundles.slice(0, 5);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ maxWidth: "1100px" }}>
      {/* Stats Grid — responsive: 1 col mobile, 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: "16px", marginBottom: "16px" }}>
        <LaunchOverviewCard total={totalLaunches} remaining={remaining} />
        <VoiceProfileCard />
        <PlatformActivityCard bundles={bundles} />
        <VoiceMatchCard />
      </div>

      {/* Secondary cards row — expanded to fill the grid */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "16px", marginBottom: "24px" }}>
        <div className="md:col-span-1">
          <FeatureHighlightCard />
        </div>
        <div className="md:col-span-1">
          <PlatformBreakdownCard />
        </div>
      </div>

      {/* Recent Launches */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.4 }}
      >
        <div
          style={{
            background: "var(--bg-card-glass)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--border-card)",
            borderRadius: "24px",
            padding: "32px",
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: "16px" }}>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-secondary)" }}>
              Recent Launches
            </span>
            <button
              onClick={() => router.push("/dashboard/bundles")}
              style={{
                fontSize: "13px",
                color: "var(--accent-lime)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
              }}
            >
              View all →
            </button>
          </div>

          {recentBundles.length === 0 ? (
            <EmptyLaunches />
          ) : (
            <div>
              {recentBundles.map((bundle, i) => (
                <LaunchRow
                  key={bundle.id}
                  id={bundle.id}
                  productName={bundle.product_name}
                  description={bundle.product_description || ""}
                  status={bundle.status}
                  platformCount={bundle.posts_count ?? 0}
                  relativeTime={getRelativeTime(bundle.created_at)}
                  index={i}
                />
              ))}

              {bundles.length > 5 && (
                <button
                  onClick={() => router.push("/dashboard/bundles")}
                  className="w-full text-left"
                  style={{
                    padding: "10px 12px",
                    fontSize: "13px",
                    color: "var(--accent-lime)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    fontWeight: 600,
                  }}
                >
                  View all {bundles.length} launches →
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
