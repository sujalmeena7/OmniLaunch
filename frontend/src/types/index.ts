/* ============================================================
   OmniLaunch — Shared Types
   ============================================================ */

// ── Auth ──────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  plan: "free" | "pro" | "team";
  launches_remaining: number;
  avatar_url?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}

// ── Voice ─────────────────────────────────────────────────────
export interface VoiceSample {
  type: "url" | "text";
  value: string;
  platform?: string;
}

export interface ToneManifesto {
  sentence_structure: string;
  avg_sentence_length: number;
  vocabulary_level: string;
  technicality_score: number;
  emoji_usage: string;
  emoji_examples: string[];
  hashtag_usage: string;
  humor_level: string;
  formality: number;
  first_person_preference: string;
  call_to_action_style: string;
  forbidden_patterns: string[];
  signature_phrases: string[];
  paragraph_length: string;
  opening_style: string;
  closing_style: string;
}

export interface VoiceProfile {
  id: string;
  name: string;
  tone_manifesto: ToneManifesto;
  sample_count: number;
  confidence: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Platforms ─────────────────────────────────────────────────
export interface PlatformRule {
  id: string;
  platform: string;
  sub_target: string | null;
  display_name: string;
  prefix: string | null;
  forbidden_words: string[];
  required_elements: string[];
  max_title_length: number | null;
  max_body_length: number | null;
  formatting_rules: Record<string, unknown>;
  schedule_notes: string | null;
}

// ── Bundles ───────────────────────────────────────────────────
export interface RuleCheck {
  rule: string;
  status: "pass" | "warning" | "fail";
  detail: string;
}

export interface GeneratedPost {
  id: string;
  platform: string;
  sub_target: string | null;
  title: string | null;
  body: string | null;
  voice_match_score: number;
  rule_checks: RuleCheck[];
  ai_isms_removed: string[];
  revision: number;
  updated_at: string;
}

export interface LaunchBundle {
  id: string;
  product_name: string;
  status: "pending" | "generating" | "complete" | "failed";
  posts: GeneratedPost[];
  created_at: string;
  completed_at: string | null;
}

// ── Platform Metadata ────────────────────────────────────────
export const PLATFORM_META: Record<string, { label: string; icon: string; color: string }> = {
  hackernews: { label: "Hacker News", icon: "🟠", color: "#ff6600" },
  producthunt: { label: "Product Hunt", icon: "🐱", color: "#da552f" },
  reddit: { label: "Reddit", icon: "🔴", color: "#ff4500" },
  indiehackers: { label: "IndieHackers", icon: "💼", color: "#0e6db4" },
  twitter: { label: "Twitter / X", icon: "🐦", color: "#1da1f2" },
};
