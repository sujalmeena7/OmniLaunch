"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";
import { useLaunchStore } from "@/stores/launchStore";
import { useBundleSSE } from "@/lib/hooks/useBundleSSE";
import ProductForm, { type ProductFormData } from "@/components/launch/ProductForm";
import PlatformTabs from "@/components/launch/PlatformTabs";
import PostPreview from "@/components/launch/PostPreview";
import ValidationGutter from "@/components/launch/ValidationGutter";
import EmptyState from "@/components/launch/EmptyState";
import GeneratingState from "@/components/launch/GeneratingState";
import type { GeneratedPost, VoiceProfile, PlatformRule } from "@/types";
import { LaunchSkeleton } from "@/components/ui/skeletons";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function LaunchPage() {
  const {
    voiceProfiles,
    setVoiceProfiles,
    platformRules,
    setPlatformRules,
    editedPosts,
    updatePost,
    user,
    decrementLaunchesRemaining,
  } = useAppStore();

  // Persist generation state across navigation
  const launchStore = useLaunchStore();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(launchStore.generating);
  const [bundleId, setBundleId] = useState<string | null>(launchStore.bundleId);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>(launchStore.generatedPosts);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(launchStore.error || "");
  const [usePollingFallback, setUsePollingFallback] = useState(false);

  // Mobile layout state
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [mobileView, setMobileView] = useState<"input" | "preview">("input");

  // Get auth token for SSE connection
  const token = useMemo(() => api.getToken(), []);

  // SSE hook — only active when bundleId is set and not in polling fallback mode
  const sseEnabled = bundleId && !usePollingFallback ? bundleId : null;
  const {
    events: sseEvents,
    isComplete: sseComplete,
    isFailed: sseFailed,
    error: sseError,
  } = useBundleSSE(sseEnabled, token);

  // Derive current generation step from SSE events for the GeneratingState component
  const currentStep = useMemo(() => {
    if (sseEvents.length === 0) return 0;
    const lastEvent = sseEvents[sseEvents.length - 1];
    switch (lastEvent.status) {
      case "researching":
        return 0;
      case "drafting":
        return 1;
      case "humanizing":
        return 2;
      case "complete":
      case "stream_end":
        return 3;
      default:
        return 0;
    }
  }, [sseEvents]);

  // Derive current platform being processed from SSE events
  const currentPlatform = useMemo(() => {
    if (sseEvents.length === 0) return null;
    const lastEvent = sseEvents[sseEvents.length - 1];
    return lastEvent.platform;
  }, [sseEvents]);

  // Handle SSE completion — fetch final bundle data
  useEffect(() => {
    if (sseComplete && bundleId) {
      api
        .getBundle(bundleId)
        .then((data) => {
          const bundle = data as unknown as {
            status: string;
            posts: GeneratedPost[];
          };
          setGeneratedPosts(bundle.posts || []);
          setGenerating(false);
          launchStore.completeGeneration(bundle.posts || []);
        })
        .catch(() => {
          setError("Failed to fetch completed bundle");
          setGenerating(false);
          launchStore.failGeneration("Failed to fetch completed bundle");
        });
    }
  }, [sseComplete, bundleId]);

  // Handle SSE failure — display error message
  useEffect(() => {
    if (sseFailed) {
      const failedEvent = sseEvents.find((e) => e.status === "failed");
      setError(failedEvent?.detail || "Generation failed. Please try again.");
      setGenerating(false);
    }
  }, [sseFailed, sseEvents]);

  const pollBundle = useCallback((id: string) => {
    let attempts = 0;
    const MAX_ATTEMPTS = 60;
    const POLL_INTERVAL = 2000;

    const poll = async () => {
      attempts++;
      try {
        const bundle = (await api.getBundle(id)) as {
          status: string;
          posts: GeneratedPost[];
        };
        if (bundle.status === "complete") {
          setGeneratedPosts(bundle.posts || []);
          setGenerating(false);
          launchStore.completeGeneration(bundle.posts || []);
          return;
        }
        if (bundle.status === "failed") {
          setError("Generation failed. Please try again.");
          setGenerating(false);
          launchStore.failGeneration("Generation failed. Please try again.");
          return;
        }
        if (attempts >= MAX_ATTEMPTS) {
          setError(
            "Generation is taking longer than expected. Check back in your Bundles page."
          );
          setGenerating(false);
          return;
        }
        setTimeout(poll, POLL_INTERVAL);
      } catch {
        setError("Failed to check bundle status");
        setGenerating(false);
      }
    };

    setTimeout(poll, 3000);
  }, []);

  // Handle SSE connection error — fall back to polling
  useEffect(() => {
    if (sseError && bundleId && generating && !usePollingFallback) {
      setUsePollingFallback(true);
      pollBundle(bundleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sseError, bundleId, generating, usePollingFallback]);

  // Merge posts with any session edits
  const displayPosts: GeneratedPost[] = generatedPosts.map((p) => ({
    ...p,
    ...editedPosts[p.id],
  }));

  const activePost = displayPosts[activeTab] ?? null;

  // Load initial data
  useEffect(() => {
    Promise.all([
      api.listVoiceProfiles().then((data) => {
        const profiles = (data.profiles || []) as unknown as VoiceProfile[];
        setVoiceProfiles(profiles);
      }),
      api.listPlatforms().then((data) => {
        setPlatformRules((data.platforms || []) as unknown as PlatformRule[]);
      }),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setVoiceProfiles, setPlatformRules]);

  // Resume generation if user navigated away and came back while generating
  useEffect(() => {
    if (launchStore.generating && launchStore.bundleId && !generating) {
      setGenerating(true);
      setBundleId(launchStore.bundleId);
      setUsePollingFallback(true);
      pollBundle(launchStore.bundleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = useCallback(
    async (formData: ProductFormData) => {
      setGenerating(true);
      setError("");
      setGeneratedPosts([]);
      setBundleId(null);
      setActiveTab(0);
      setUsePollingFallback(false);

      try {
        const result = (await api.generateBundle({
          voice_profile_id: formData.voiceProfileId,
          product: {
            name: formData.productName,
            description: formData.description,
            url: formData.url || undefined,
            target_audience: formData.targetAudience || undefined,
            tech_stack: formData.techStack
              ? formData.techStack.split(",").map((s) => s.trim())
              : undefined,
          },
          targets: formData.selectedPlatforms,
        })) as { bundle_id: string; status: string };

        setBundleId(result.bundle_id);
        launchStore.startGeneration(result.bundle_id);
        // Decrement launches_remaining in the store (backend already decremented server-side)
        decrementLaunchesRemaining();
        // SSE hook will automatically connect via the bundleId state change.
        // Polling is only used as fallback if SSE connection fails.
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Generation failed";
        setError(errorMsg);
        setGenerating(false);
        launchStore.failGeneration(errorMsg);
      }
    },
    [decrementLaunchesRemaining, launchStore]
  );

  const handleEdit = useCallback(
    (postId: string, changes: Partial<GeneratedPost>) => {
      if (!bundleId) return;
      updatePost(bundleId, postId, changes);
    },
    [bundleId, updatePost]
  );

  const handleRegenerate = useCallback((postId: string) => {
    // Triggered when regeneration polling completes successfully.
    // Re-fetch the bundle to get the updated post data.
    if (!bundleId) return;
    api.getBundle(bundleId).then((data) => {
      const bundle = data as unknown as { posts: GeneratedPost[] };
      setGeneratedPosts(bundle.posts || []);
    }).catch(() => {});
  }, [bundleId]);

  // Quota state
  const quotaExhausted = (user?.launches_remaining ?? 0) <= 0;

  if (loading) {
    return <LaunchSkeleton />;
  }

  // Mobile tab switcher component
  const MobileViewSwitcher = () => (
    <div
      className="flex md:hidden"
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--bg-elevated)",
      }}
    >
      <button
        onClick={() => setMobileView("input")}
        style={{
          flex: 1,
          padding: "12px 0",
          fontSize: "13px",
          fontWeight: 600,
          fontFamily: "var(--font-sans)",
          color: mobileView === "input" ? "var(--text-secondary)" : "var(--text-muted)",
          background: "none",
          border: "none",
          borderBottom: mobileView === "input" ? "2px solid var(--accent-teal)" : "2px solid transparent",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        Input
      </button>
      <button
        onClick={() => setMobileView("preview")}
        style={{
          flex: 1,
          padding: "12px 0",
          fontSize: "13px",
          fontWeight: 600,
          fontFamily: "var(--font-sans)",
          color: mobileView === "preview" ? "var(--text-secondary)" : "var(--text-muted)",
          background: "none",
          border: "none",
          borderBottom: mobileView === "preview" ? "2px solid var(--accent-teal)" : "2px solid transparent",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        Preview
      </button>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row" style={{ height: "calc(100vh - 120px)", gap: "24px" }}>
      {/* Mobile tab switcher — visible only on mobile */}
      {isMobile && <MobileViewSwitcher />}

      {/* Left Panel — Product Form */}
      <div
        className={`flex-shrink-0 ${isMobile && mobileView !== "input" ? "hidden" : ""}`}
        style={{
          width: isMobile ? "100%" : "380px",
          flex: isMobile ? "1 1 auto" : undefined,
          overflow: isMobile ? "auto" : undefined,
        }}
      >
        <ProductForm
          onSubmit={handleGenerate}
          isGenerating={generating}
          voiceProfiles={voiceProfiles}
          platforms={platformRules}
          quotaExhausted={quotaExhausted}
        />
      </div>

      {/* Right Panel — Preview */}
      <div
        className={`flex flex-col flex-1 ${isMobile && mobileView !== "preview" ? "hidden" : ""}`}
        style={{ 
          background: "var(--bg-elevated)", 
          overflow: "hidden",
          borderRadius: "24px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-md)"
        }}
      >
        {error && !generating && displayPosts.length === 0 && (
          <div
            style={{
              padding: "10px 24px",
              fontSize: "13px",
              color: "var(--accent-red)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            {error}
          </div>
        )}

        {displayPosts.length > 0 ? (
          <>
            <PlatformTabs
              posts={displayPosts}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            <div className="flex-1 overflow-y-auto" style={{ padding: isMobile ? "16px" : "24px" }}>
              {activePost && (
                <>
                  <PostPreview
                    post={activePost}
                    bundleId={bundleId || ""}
                    platformRules={platformRules}
                    onEdit={handleEdit}
                    onRegenerate={handleRegenerate}
                    isComplete={!generating}
                  />
                  <ValidationGutter
                    checks={activePost.rule_checks}
                    voiceMatchScore={activePost.voice_match_score}
                    aiIsmsRemoved={activePost.ai_isms_removed}
                    collapsible={isMobile}
                  />
                </>
              )}
            </div>
          </>
        ) : generating ? (
          <div className="flex flex-col items-center justify-center" style={{ height: "100%", gap: "0" }}>
            <GeneratingState bundleId={bundleId} currentStep={currentStep} />
            {currentPlatform && (
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  textAlign: "center",
                  marginTop: "-16px",
                }}
              >
                Processing: <span style={{ color: "var(--accent-teal)", fontWeight: 500 }}>{currentPlatform}</span>
                {sseEvents.length > 0 && sseEvents[sseEvents.length - 1].detail && (
                  <span style={{ marginLeft: "8px", opacity: 0.7 }}>
                    — {sseEvents[sseEvents.length - 1].detail}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

