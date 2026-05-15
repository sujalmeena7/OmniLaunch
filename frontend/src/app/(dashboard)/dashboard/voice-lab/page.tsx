"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";
import type { VoiceProfile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Dna, Plus, Trash2, Sparkles, Activity, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { VoiceLabSkeleton } from "@/components/ui/skeletons";

export default function VoiceLabPage() {
  const { voiceProfiles, setVoiceProfiles, activeVoice, setActiveVoice } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [profileName, setProfileName] = useState("My Voice");
  const [samples, setSamples] = useState<string[]>(['']);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const data = await api.listVoiceProfiles();
      const profiles = (data.profiles || []) as unknown as VoiceProfile[];
      setVoiceProfiles(profiles);
      if (profiles.length > 0 && !activeVoice) {
        setActiveVoice(profiles[0]);
      }
    } catch {
      // Silently fail on load
    } finally {
      setLoading(false);
    }
  };

  const addSample = () => {
    if (samples.length >= 5) return;
    setSamples([...samples, '']);
  };

  const removeSample = (index: number) => {
    if (samples.length <= 1) return;
    setSamples(samples.filter((_, i) => i !== index));
  };

  const updateSample = (index: number, value: string) => {
    const updated = [...samples];
    updated[index] = value;
    setSamples(updated);
  };

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    setTraining(true);
    setError("");
    setSuccess("");

    const validSamples = samples.filter((s) => s.trim().length > 0);
    if (validSamples.length === 0) {
      setError("Please provide at least one writing sample.");
      setTraining(false);
      return;
    }

    try {
      const payload = validSamples.map((s) => ({ type: "text" as const, value: s }));
      await api.trainVoice(profileName, payload);
      setSuccess("Voice profile created! Your Tone Manifesto is ready.");
      setSamples(['']);
      setProfileName("My Voice");
      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Training failed");
    } finally {
      setTraining(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteVoiceProfile(id);
      await loadProfiles();
      if (activeVoice?.id === id) setActiveVoice(null);
    } catch {
      setError("Failed to delete profile");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "14px",
    border: "1.5px solid var(--border-strong)",
    background: "rgba(255, 255, 255, 0.4)",
    color: "var(--text-secondary)",
    fontSize: "14px",
    fontFamily: "var(--font-sans)",
    outline: "none",
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    boxShadow: "var(--shadow-sm)",
  };

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

  return (
    <>
    {loading ? (
      <VoiceLabSkeleton />
    ) : (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px 24px 24px" }}>
      <div className="flex items-center" style={{ gap: "12px", marginBottom: "16px" }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "rgba(192, 255, 51, 0.1)",
            border: "1px solid rgba(192, 255, 51, 0.2)",
          }}
        >
          <Dna size={24} style={{ color: "var(--accent-lime)" }} />
        </div>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-secondary)", margin: 0, fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>Voice Lab</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px", fontWeight: 500 }}>
            Engineered voice cloning from your natural writing DNA.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", marginTop: "8px" }}>
        {/* Left: Training Form */}
        <div>
          <form onSubmit={handleTrain} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Profile Identity */}
            <div>
              <label style={labelStyle}>Profile Identity</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="e.g., Casual Tech Writer"
                style={inputStyle}
              />
            </div>

            {/* Training Samples */}
            <div>
              <label style={labelStyle}>Training Samples</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {samples.map((sample, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <textarea
                      value={sample}
                      onChange={(e) => updateSample(i, e.target.value)}
                      placeholder="Paste a writing sample here... (e.g., a Reddit post, tweet, or blog excerpt)"
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical", flex: 1 }}
                    />
                    {samples.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSample(i)}
                        style={{
                          padding: "10px",
                          borderRadius: "10px",
                          border: "1px solid rgba(250, 82, 82, 0.2)",
                          background: "rgba(250, 82, 82, 0.05)",
                          color: "var(--accent-red)",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(250, 82, 82, 0.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(250, 82, 82, 0.05)"; }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {samples.length < 5 && (
                <button
                  type="button"
                  onClick={addSample}
                  style={{
                    marginTop: "8px",
                    padding: "10px 16px",
                    borderRadius: "12px",
                    border: "1px dashed var(--border-strong)",
                    background: "var(--bg-elevated)",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                    boxShadow: "var(--shadow-sm)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--text-secondary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.1)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  <Plus size={14} /> Add Writing Sample
                </button>
              )}
            </div>

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(250, 82, 82, 0.08)", border: "1px solid rgba(250, 82, 82, 0.15)", color: "var(--accent-red)", fontSize: "13px" }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(64, 192, 87, 0.08)", border: "1px solid rgba(64, 192, 87, 0.15)", color: "var(--accent-green)", fontSize: "13px" }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={training}
              style={{
                width: "100%",
                height: "44px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #C0FF33 0%, #D4F542 100%)",
                color: "#0f1a4a",
                fontWeight: 700,
                fontSize: "15px",
                cursor: training ? "wait" : "pointer",
                opacity: training ? 0.7 : 1,
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: "0 8px 24px rgba(212, 245, 66, 0.2)",
                transition: "all 0.2s ease",
              }}
            >
              {training ? (
                <>
                  <Activity size={18} className="animate-pulse" />
                  Analyzing Writing DNA...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Engineer Voice Profile
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Existing Profiles + Manifesto */}
        <div>
          <h2 style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "-48px", marginBottom: "12px", fontFamily: "var(--font-heading)" }}>Your Voice Profiles</h2>

          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2].map(i => (
                <div key={i} style={{ height: "100px", borderRadius: "16px", background: "rgba(255,255,255,0.02)" }} />
              ))}
            </div>
          ) : voiceProfiles.length === 0 ? (
            <div
              style={{
                padding: "48px 32px",
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px dashed rgba(255, 255, 255, 0.1)",
                textAlign: "center",
              }}
            >
              <FileText size={40} style={{ color: "var(--text-muted)", marginBottom: "16px", opacity: 0.5 }} />
              <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
                No voice DNA detected yet.<br />Train a profile to see your manifesto.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <AnimatePresence mode="popLayout">
                {voiceProfiles.map((profile) => {
                  const isActive = activeVoice?.id === profile.id;
                  return (
                    <motion.div
                      key={profile.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setActiveVoice(profile)}
                      style={{
                        padding: "24px",
                        borderRadius: "24px",
                        background: isActive ? "var(--bg-card-glass)" : "var(--bg-surface)",
                        backdropFilter: isActive ? "blur(12px)" : "none",
                        border: "1px solid",
                        borderColor: isActive ? "var(--accent-lime)" : "var(--border-subtle)",
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: isActive ? "var(--shadow-lg)" : "var(--shadow-sm)",
                      }}
                    >
                      {isActive && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "2px",
                            height: "100%",
                            background: "var(--accent-lime)",
                          }}
                        />
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-secondary)" }}>{profile.name}</span>
                            {isActive && <CheckCircle2 size={14} style={{ color: "#4d7c0f" }} />}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", fontWeight: 500 }}>
                            {profile.sample_count} samples · Analyzed {new Date(profile.created_at).toLocaleDateString()}
                          </div>
                        </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#4d7c0f", textTransform: "uppercase" }}>Confidence</div>
                            <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-secondary)" }}>{Math.round(profile.confidence * 100)}%</div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(profile.id); }}
                            style={{
                              padding: "8px",
                              borderRadius: "10px",
                              border: "1px solid rgba(250, 82, 82, 0.1)",
                              background: "rgba(250, 82, 82, 0.05)",
                              color: "var(--accent-red)",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(250, 82, 82, 0.1)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(250, 82, 82, 0.05)"; }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Tone Manifesto Details */}
                      {isActive && profile.tone_manifesto && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          style={{
                            marginTop: "20px",
                            paddingTop: "20px",
                            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                          }}
                        >
                          <div className="flex items-center" style={{ gap: "8px", marginBottom: "16px" }}>
                            <FileText size={14} style={{ color: "#4d7c0f" }} />
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#4d7c0f", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tone Manifesto</span>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            {[
                              { label: "Structure", value: profile.tone_manifesto.sentence_structure, icon: <Activity size={12} /> },
                              { label: "Formality", value: `${Math.round(profile.tone_manifesto.formality * 100)}%`, icon: <CheckCircle2 size={12} /> },
                              { label: "Emoji Usage", value: profile.tone_manifesto.emoji_usage, icon: <Sparkles size={12} /> },
                              { label: "Vocabulary", value: profile.tone_manifesto.vocabulary_level, icon: <FileText size={12} /> },
                              { label: "Humor Level", value: profile.tone_manifesto.humor_level, icon: <Activity size={12} /> },
                              { label: "Openings", value: profile.tone_manifesto.opening_style, icon: <Sparkles size={12} /> },
                            ].map(item => (
                              <div key={item.label} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                <div style={{ marginTop: "2px", color: "var(--text-muted)" }}>{item.icon}</div>
                                <div>
                                  <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>{item.label}</div>
                                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600, marginTop: "2px" }}>{item.value}</div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {profile.tone_manifesto.signature_phrases?.length > 0 && (
                            <div style={{ marginTop: "20px" }}>
                              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: "8px" }}>Signature Markers</div>
                              <div className="flex flex-wrap" style={{ gap: "8px" }}>
                                  {profile.tone_manifesto.signature_phrases.map((phrase, i) => (
                                    <div
                                      key={i}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "8px 14px",
                                        borderRadius: "10px",
                                        background: "var(--bg-elevated)",
                                        border: "1px solid var(--border-subtle)",
                                        borderLeft: "3px solid var(--accent-lime)",
                                        boxShadow: "var(--shadow-sm)",
                                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateX(2px)";
                                        e.currentTarget.style.boxShadow = "var(--shadow-md)";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateX(0)";
                                        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                                      }}
                                    >
                                      <CheckCircle2 size={14} style={{ color: "var(--accent-lime)", flexShrink: 0 }} />
                                      <span
                                        style={{
                                          fontSize: "13px",
                                          color: "var(--text-primary)",
                                          fontWeight: 600,
                                          lineHeight: "1.2",
                                        }}
                                      >
                                        {phrase}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
    )}
    </>
  );
}
