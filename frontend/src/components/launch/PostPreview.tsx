/* ============================================================
   OmniLaunch — Post Preview with Inline Edit & Regenerate
   ============================================================ */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, RefreshCw, Copy, Check, Loader2 } from "lucide-react";
import type { GeneratedPost } from "@/types";
import { api } from "@/lib/api";
import { useValidation } from "@/hooks/useValidation";
import type { PlatformRule } from "@/types";

interface PostPreviewProps {
  post: GeneratedPost;
  bundleId: string;
  platformRules: PlatformRule[];
  onEdit: (postId: string, changes: Partial<GeneratedPost>) => void;
  onRegenerate: (postId: string) => void;
  isComplete: boolean;
}

export default function PostPreview({
  post,
  bundleId,
  platformRules,
  onEdit,
  onRegenerate,
  isComplete,
}: PostPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || "");
  const [editBody, setEditBody] = useState(post.body || "");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(post.updated_at);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const validation = useValidation(
    editTitle,
    editBody,
    [post.platform],
    platformRules
  );

  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editBody, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setEditTitle(post.title || "");
      setEditBody(post.body || "");
    }
    if (post.updated_at !== lastUpdatedAt) {
      setLastUpdatedAt(post.updated_at);
    }
  }, [post.title, post.body, post.updated_at, isEditing, lastUpdatedAt]);

  const handleCopy = useCallback(() => {
    const text = `${post.title || ""}\n\n${post.body || ""}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [post]);

  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      onEdit(post.id, { title: editTitle, body: editBody });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      setIsEditing(false);
    } else {
      setEditTitle(post.title || "");
      setEditBody(post.body || "");
      setIsEditing(true);
    }
  }, [isEditing, editTitle, editBody, post, onEdit]);

  const handleCancel = useCallback(() => {
    setEditTitle(post.title || "");
    setEditBody(post.body || "");
    onEdit(post.id, { title: post.title || "", body: post.body || "" });
    setIsEditing(false);
  }, [post, onEdit]);

  const handleRegenerate = useCallback(async () => {
    if (!isComplete || regenerating) return;
    setRegenerating(true);
    setRegenError("");

    try {
      await api.regeneratePost(bundleId, post.platform);

      const startTime = Date.now();
      const MAX_WAIT = 60000;
      const POLL_INTERVAL = 2000;

      const poll = async () => {
        if (Date.now() - startTime > MAX_WAIT) {
          setRegenerating(false);
          setRegenError("Regeneration timed out — original restored");
          return;
        }

        try {
          const bundle = (await api.getBundle(bundleId)) as {
            posts: GeneratedPost[];
          };
          const updatedPost = bundle.posts.find((p) => p.id === post.id);
          if (updatedPost && updatedPost.updated_at !== lastUpdatedAt) {
            setLastUpdatedAt(updatedPost.updated_at);
            setRegenerating(false);
            onRegenerate(post.id);
            return;
          }
        } catch {
          // Continue polling
        }

        setTimeout(poll, POLL_INTERVAL);
      };

      setTimeout(poll, POLL_INTERVAL);
    } catch {
      setRegenerating(false);
      setRegenError("Regeneration failed — original restored");
    }
  }, [bundleId, post.id, post.platform, lastUpdatedAt, isComplete, regenerating, onRegenerate]);

  const actionButtonBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "0 12px",
    height: "32px",
    borderRadius: "8px",
    border: "1px solid var(--border-subtle)",
    background: "var(--bg-elevated)",
    color: "var(--text-secondary)",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    transition: "all 0.15s ease",
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Spinner overlay during regenerate */}
      <AnimatePresence>
        {regenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(10, 10, 11, 0.8)",
              borderRadius: "8px",
              zIndex: 10,
              gap: "12px",
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 size={32} style={{ color: "var(--accent-teal)" }} />
            </motion.div>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Regenerating...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Regeneration error */}
      <AnimatePresence>
        {regenError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: "rgba(250, 82, 82, 0.08)",
              border: "1px solid rgba(250, 82, 82, 0.15)",
              color: "var(--accent-red)",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {regenError}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {/* Title edit */}
            <div>
              <label
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => {
                  setEditTitle(e.target.value);
                  onEdit(post.id, { title: e.target.value, body: editBody });
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-secondary)",
                  fontSize: "15px",
                  fontWeight: 500,
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                }}
              />
            </div>

            {/* Body edit */}
            <div style={{ marginTop: "16px" }}>
              <label
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Body
              </label>
              <textarea
                ref={textareaRef}
                value={editBody}
                onChange={(e) => {
                  setEditBody(e.target.value);
                  onEdit(post.id, { title: editTitle, body: e.target.value });
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  lineHeight: 1.7,
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                  resize: "none",
                  overflow: "hidden",
                  minHeight: "120px",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "4px",
                  fontSize: "11px",
                  color:
                    validation.bodyLength.status === "over"
                      ? "var(--accent-red)"
                      : validation.bodyLength.status === "warning"
                      ? "var(--accent-amber)"
                      : "var(--text-muted)",
                }}
              >
                {validation.bodyLength.count}/{validation.bodyLength.max}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="read"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {/* Title display */}
            {post.title && (
              <div>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Title
                </label>
                <div
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "var(--bg-elevated)",
                    color: "var(--text-secondary)",
                    fontSize: "15px",
                    fontWeight: 500,
                    lineHeight: 1.4,
                  }}
                >
                  {post.title}
                </div>
              </div>
            )}

            {/* Body display */}
            <div style={{ marginTop: post.title ? "16px" : "0" }}>
              <label
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Body
              </label>
              <div
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "var(--bg-elevated)",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {post.body || "(No body content)"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action row */}
      <div className="flex" style={{ gap: "8px", marginTop: "16px" }}>
        {isComplete && (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            title="Regenerate this post"
            style={{
              ...actionButtonBase,
              opacity: regenerating ? 0.6 : 1,
              cursor: regenerating ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={14} />
            Regenerate
          </button>
        )}

        <button
          onClick={handleEditToggle}
          style={{
            ...actionButtonBase,
            borderColor: isEditing ? "rgba(29, 158, 117, 0.4)" : "var(--border-subtle)",
            color: isEditing ? "var(--accent-teal)" : "var(--text-secondary)",
            background: isEditing ? "rgba(29, 158, 117, 0.08)" : "var(--bg-elevated)",
          }}
        >
          <Pencil size={14} />
          {isEditing ? (saved ? "Saved" : "Save") : "Edit"}
        </button>

        {isEditing && (
          <button onClick={handleCancel} style={actionButtonBase}>
            Cancel
          </button>
        )}

        <button
          onClick={handleCopy}
          style={{
            ...actionButtonBase,
            color: copied ? "var(--accent-teal)" : "var(--text-secondary)",
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
