/**
 * OmniLaunch — Frontend Supabase Client
 *
 * Used for OAuth flows (Google, GitHub) which require client-side
 * Supabase auth. Email/password auth still goes through the backend API.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create client only if env vars are available (avoids build-time errors)
export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
