-- ============================================================
-- OmniLaunch — Initial Schema (Phases 1-3 + Billing)
-- ============================================================

-- Enable pgvector extension for voice embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Profiles (extends Supabase auth.users) ───────────────────
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
    launches_remaining INT DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Subscriptions (Billing) ──────────────────────────────────
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'team')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    launches_per_month INT DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Voice Profiles ───────────────────────────────────────────
CREATE TABLE public.voice_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Default Voice',
    tone_manifesto JSONB NOT NULL DEFAULT '{}',
    style_embedding VECTOR(768),
    source_samples JSONB DEFAULT '[]',
    sample_count INT DEFAULT 0,
    confidence FLOAT DEFAULT 0.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Platform Rules (Rulebook) ────────────────────────────────
CREATE TABLE public.platform_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    sub_target TEXT,
    display_name TEXT NOT NULL,
    icon_url TEXT,
    prefix TEXT,
    forbidden_words TEXT[] DEFAULT '{}',
    required_elements TEXT[] DEFAULT '{}',
    max_title_length INT,
    max_body_length INT,
    formatting_rules JSONB DEFAULT '{}',
    schedule_notes TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Launch Bundles ───────────────────────────────────────────
CREATE TABLE public.launch_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    voice_profile_id UUID REFERENCES public.voice_profiles(id),
    product_name TEXT NOT NULL,
    product_description TEXT NOT NULL,
    product_url TEXT,
    target_audience TEXT,
    tech_stack TEXT[],
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'complete', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- ── Generated Posts ──────────────────────────────────────────
CREATE TABLE public.generated_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID REFERENCES public.launch_bundles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    sub_target TEXT,
    title TEXT,
    body TEXT,
    voice_match_score FLOAT DEFAULT 0.0,
    rule_violations JSONB DEFAULT '[]',
    rule_pass_count INT DEFAULT 0,
    rule_total_count INT DEFAULT 0,
    ai_isms_removed JSONB DEFAULT '[]',
    revision INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_voice_profiles_user ON public.voice_profiles(user_id);
CREATE INDEX idx_launch_bundles_user ON public.launch_bundles(user_id);
CREATE INDEX idx_generated_posts_bundle ON public.generated_posts(bundle_id);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_platform_rules_platform ON public.platform_rules(platform, sub_target);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.launch_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_posts ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own data
CREATE POLICY "Users manage own profile"
    ON public.profiles FOR ALL
    USING (auth.uid() = id);

CREATE POLICY "Users manage own subscriptions"
    ON public.subscriptions FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own voice profiles"
    ON public.voice_profiles FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own bundles"
    ON public.launch_bundles FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users read own posts"
    ON public.generated_posts FOR SELECT
    USING (
        bundle_id IN (
            SELECT id FROM public.launch_bundles WHERE user_id = auth.uid()
        )
    );

-- Platform rules are public read
ALTER TABLE public.platform_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read platform rules"
    ON public.platform_rules FOR SELECT
    USING (true);
