/* ============================================================
   OmniLaunch — Product Form with Live Validation
   ============================================================ */

"use client";

import { useState, useCallback } from "react";
import type { VoiceProfile, PlatformRule } from "@/types";
import { useValidation } from "@/hooks/useValidation";
import { motion } from "framer-motion";
import { Rocket, AlertTriangle, Link2, Loader2, ArrowUpRight, Briefcase, Code2 } from "lucide-react";
import { useRouter } from "next/navigation";

export interface ProductFormData {
  voiceProfileId: string;
  productName: string;
  description: string;
  url: string;
  targetAudience: string;
  techStack: string;
  selectedPlatforms: { platform: string; sub_target?: string }[];
}

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  isGenerating: boolean;
  voiceProfiles: VoiceProfile[];
  platforms: PlatformRule[];
  quotaExhausted?: boolean;
}

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--text-primary)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  display: "block",
  marginBottom: "10px",
  fontWeight: 700,
  fontFamily: "var(--font-heading)",
};

const inputBaseStyle: React.CSSProperties = {
  width: "100%",
  padding: "0 16px",
  height: "52px",
  borderRadius: "14px",
  border: "1.5px solid var(--border-strong)",
  background: "var(--bg-elevated)",
  color: "var(--text-secondary)",
  fontSize: "14px",
  fontFamily: "var(--font-sans)",
  outline: "none",
  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
  boxShadow: "var(--shadow-sm)",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  borderRadius: "16px",
  border: "1.5px solid var(--border-strong)",
  background: "var(--bg-elevated)",
  color: "var(--text-secondary)",
  fontSize: "14px",
  fontFamily: "var(--font-sans)",
  outline: "none",
  resize: "none",
  lineHeight: 1.6,
  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
  boxShadow: "var(--shadow-sm)",
};

function toSentenceCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Returns a Lucide icon element for a given platform */
function PlatformIcon({ platform, subTarget }: { platform: string; subTarget?: string | null }) {
  const size = 12;
  const style: React.CSSProperties = { flexShrink: 0 };

  if (platform === "linkedin") {
    return <Briefcase size={size} style={style} />;
  }
  if (platform === "devto") {
    return <Code2 size={size} style={style} />;
  }
  // Reddit platforms (including r/sideprojects) use a colored dot
  if (platform === "reddit") {
    return <span style={{ width: size, height: size, borderRadius: "50%", background: "#ff4500", display: "inline-block", flexShrink: 0 }} />;
  }
  if (platform === "hackernews") {
    return <span style={{ width: size, height: size, borderRadius: "50%", background: "#ff6600", display: "inline-block", flexShrink: 0 }} />;
  }
  if (platform === "producthunt") {
    return <span style={{ width: size, height: size, borderRadius: "50%", background: "#da552f", display: "inline-block", flexShrink: 0 }} />;
  }
  if (platform === "indiehackers") {
    return <span style={{ width: size, height: size, borderRadius: "50%", background: "#0e6db4", display: "inline-block", flexShrink: 0 }} />;
  }
  if (platform === "twitter") {
    return <span style={{ width: size, height: size, borderRadius: "50%", background: "#1da1f2", display: "inline-block", flexShrink: 0 }} />;
  }
  return null;
}

function CounterDisplay({
  count,
  max,
  status,
}: {
  count: number;
  max: number;
  status: "ok" | "warning" | "over";
}) {
  const color =
    status === "over"
      ? "var(--accent-red)"
      : status === "warning"
      ? "var(--accent-amber)"
      : "var(--text-muted)";
  return (
    <div
      style={{
        textAlign: "right",
        fontSize: "11px",
        color,
        marginTop: "4px",
      }}
    >
      {count}/{max}
    </div>
  );
}

function ForbiddenWordPill({ word }: { word: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "var(--radius-sm)",
        background: "rgba(250, 176, 5, 0.15)",
        color: "var(--accent-amber)",
        fontSize: "11px",
        marginTop: "6px",
        marginRight: "4px",
      }}
    >
      {word}
    </span>
  );
}

export default function ProductForm({
  onSubmit,
  isGenerating,
  voiceProfiles,
  platforms,
  quotaExhausted = false,
}: ProductFormProps) {
  const router = useRouter();
  const [voiceProfileId, setVoiceProfileId] = useState(
    voiceProfiles[0]?.id || ""
  );
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [techStack, setTechStack] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<
    { platform: string; sub_target?: string }[]
  >([]);
  const [error, setError] = useState("");

  const validation = useValidation(
    productName,
    description,
    selectedPlatforms.map((p) => p.platform),
    platforms
  );

  const togglePlatform = useCallback(
    (platform: string, subTarget?: string) => {
      const exists = selectedPlatforms.find(
        (p) =>
          p.platform === platform && (p.sub_target || undefined) === subTarget
      );
      if (exists) {
        setSelectedPlatforms(
          selectedPlatforms.filter(
            (p) =>
              !(p.platform === platform && (p.sub_target || undefined) === subTarget)
          )
        );
      } else {
        setSelectedPlatforms([...selectedPlatforms, { platform, sub_target: subTarget }]);
      }
    },
    [selectedPlatforms]
  );

  const isPlatformSelected = useCallback(
    (platform: string, subTarget?: string) => {
      return selectedPlatforms.some(
        (p) =>
          p.platform === platform && (p.sub_target || undefined) === subTarget
      );
    },
    [selectedPlatforms]
  );

  const handleSubmit = useCallback(() => {
    setError("");
    if (!voiceProfileId) {
      setError("Select a voice profile first");
      return;
    }
    if (!productName.trim()) {
      setError("Product name is required");
      return;
    }
    if (!description.trim() || description.length < 10) {
      setError("Product description must be at least 10 characters");
      return;
    }
    if (selectedPlatforms.length === 0) {
      setError("Select at least one platform");
      return;
    }
    onSubmit({
      voiceProfileId,
      productName,
      description,
      url,
      targetAudience,
      techStack,
      selectedPlatforms,
    });
  }, [
    voiceProfileId,
    productName,
    description,
    url,
    targetAudience,
    techStack,
    selectedPlatforms,
    onSubmit,
  ]);

  return (
    <div className="flex flex-col" style={{ height: "100%", overflow: "hidden", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "24px", boxShadow: "var(--shadow-md)" }}>
      {/* Scrollable form area */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Voice selector */}
          <div>
            <label style={labelStyle}>Voice profile</label>
            {voiceProfiles.length === 0 ? (
              <div
                className="flex items-center"
                style={{ gap: "6px", fontSize: "12px", color: "var(--accent-amber)" }}
              >
                <AlertTriangle size={12} />
                <span>
                  No voice profiles —{" "}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push("/dashboard/voice-lab")}
                    onKeyDown={(e) => e.key === "Enter" && router.push("/dashboard/voice-lab")}
                    style={{
                      cursor: "pointer",
                      textDecoration: "underline",
                      textUnderlineOffset: "2px",
                    }}
                  >
                    Train voice first →
                  </span>
                </span>
              </div>
            ) : (
              <select
                value={voiceProfileId}
                onChange={(e) => setVoiceProfileId(e.target.value)}
                disabled={isGenerating}
                className="premium-input"
                style={{
                  ...inputBaseStyle,
                  cursor: isGenerating ? "not-allowed" : "pointer",
                  opacity: isGenerating ? 0.6 : 1,
                }}
              >
                {voiceProfiles.map((vp) => (
                  <option key={vp.id} value={vp.id}>
                    {vp.name} ({Math.round(vp.confidence * 100)}%)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Product name */}
          <div>
            <label style={labelStyle}>Product name</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="OmniLaunch"
              disabled={isGenerating}
              className="premium-input"
              style={inputBaseStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product in detail. What does it do? What problem does it solve?"
              rows={4}
              disabled={isGenerating}
              className="premium-input"
              style={textareaStyle}
            />
            <CounterDisplay
              count={validation.bodyLength.count}
              max={validation.bodyLength.max}
              status={validation.bodyLength.status}
            />
          </div>

          {/* Forbidden words */}
          {validation.hasForbiddenWords.status === "fail" && (
            <div>
              {validation.hasForbiddenWords.found.map((word) => (
                <ForbiddenWordPill key={word} word={word} />
              ))}
            </div>
          )}

          {/* URL */}
          <div>
            <label style={labelStyle}>Product URL</label>
            <div style={{ position: "relative" }}>
              <Link2
                size={14}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourproduct.com"
                disabled={isGenerating}
                className="premium-input"
                style={{ ...inputBaseStyle, paddingLeft: "42px" }}
              />
            </div>
          </div>

          {/* Audience */}
          <div>
            <label style={labelStyle}>Target audience</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Indie hackers and SaaS founders"
              disabled={isGenerating}
              className="premium-input"
              style={inputBaseStyle}
            />
          </div>

          {/* Tech stack */}
          <div>
            <label style={labelStyle}>Tech stack</label>
            <input
              type="text"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="Next.js, FastAPI, LangGraph (comma-separated)"
              disabled={isGenerating}
              className="premium-input"
              style={inputBaseStyle}
            />
          </div>

          {/* Platform selection */}
          <div>
            <label style={labelStyle}>Target platforms</label>
            <div className="flex flex-wrap" style={{ gap: "8px" }}>
              {platforms.map((rule) => {
                const key = rule.sub_target
                  ? `${rule.platform}:${rule.sub_target}`
                  : rule.platform;
                const selected = isPlatformSelected(
                  rule.platform,
                  rule.sub_target || undefined
                );
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isGenerating}
                    onClick={() =>
                      togglePlatform(rule.platform, rule.sub_target || undefined)
                    }
                    className="flex items-center"
                    style={{
                      height: "32px",
                      padding: "0 14px",
                      gap: "6px",
                      borderRadius: "9999px",
                      border: selected ? "none" : "1px solid var(--border-strong)",
                      background: selected
                        ? "linear-gradient(135deg, #C0FF33 0%, #D4F542 100%)"
                        : "var(--bg-surface-hover)",
                      color: selected
                        ? "#0f1a4a"
                        : "var(--text-primary)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: isGenerating ? "not-allowed" : "pointer",
                      opacity: isGenerating ? 0.5 : 1,
                      fontFamily: "var(--font-sans)",
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      boxShadow: selected ? "0 4px 12px rgba(212, 245, 66, 0.25)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!selected && !isGenerating) {
                        e.currentTarget.style.borderColor = "var(--border-default)";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected && !isGenerating) {
                        e.currentTarget.style.borderColor = "var(--border-subtle)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }
                    }}
                  >
                    <PlatformIcon platform={rule.platform} subTarget={rule.sub_target} />
                    {toSentenceCase(rule.sub_target || rule.display_name || rule.platform)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Platform-specific warnings */}
          {Object.entries(validation.platformSpecific).length > 0 && (
            <div className="flex flex-col" style={{ gap: "6px" }}>
              {Object.entries(validation.platformSpecific).map(
                ([platform, warnings]) =>
                  warnings.map((w, i) => (
                    <div
                      key={`${platform}-${i}`}
                      style={{
                        fontSize: "11px",
                        color: "var(--accent-amber)",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        background: "rgba(186, 117, 23, 0.08)",
                        border: "1px solid rgba(186, 117, 23, 0.15)",
                      }}
                    >
                      {w}
                    </div>
                  ))
              )}
            </div>
          )}

          {/* Submit error */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "6px",
                background: "rgba(250, 82, 82, 0.08)",
                border: "1px solid rgba(250, 82, 82, 0.15)",
                color: "var(--accent-red)",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Generate button */}
      <div
        className="flex-shrink-0"
        style={{
          padding: "20px 24px",
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-primary)",
        }}
      >
        {quotaExhausted ? (
          <div
            className="flex flex-col items-center"
            style={{ gap: "10px" }}
          >
            <div
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "rgba(250, 82, 82, 0.08)",
                border: "1px solid rgba(250, 82, 82, 0.2)",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                Launch quota exhausted
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  margin: "4px 0 0",
                }}
              >
                Upgrade your plan to generate more bundles
              </p>
            </div>
            <a
              href="/dashboard/settings"
              className="flex items-center justify-center"
              style={{
                width: "100%",
                height: "44px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #C0FF33 0%, #D4F542 100%)",
                color: "#0f1a4a",
                fontWeight: 700,
                fontSize: "15px",
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
                gap: "8px",
                boxShadow: "0 8px 24px rgba(212, 245, 66, 0.2)",
              }}
            >
              <ArrowUpRight size={16} />
              Upgrade Plan
            </a>
          </div>
        ) : (
          <motion.button
            onClick={handleSubmit}
            disabled={isGenerating}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.1 }}
            className="flex items-center justify-center"
            style={{
              width: "100%",
              height: "44px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #C0FF33 0%, #D4F542 100%)",
              color: "#0f1a4a",
              fontWeight: 700,
              fontSize: "15px",
              cursor: isGenerating ? "not-allowed" : "pointer",
              opacity: isGenerating ? 0.4 : 1,
              fontFamily: "var(--font-sans)",
              gap: "10px",
              boxShadow: "0 8px 24px rgba(212, 245, 66, 0.2)",
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Rocket size={16} />
                Generate bundle
              </>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}
