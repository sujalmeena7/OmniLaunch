-- ============================================================
-- OmniLaunch — Migration 003: Razorpay Schema Changes
-- Replaces Stripe identifiers with Razorpay equivalents,
-- adds trial support, and creates billing_events table.
-- ============================================================

-- ── Rename Stripe columns to Razorpay in subscriptions table ─
ALTER TABLE public.subscriptions
  RENAME COLUMN stripe_customer_id TO razorpay_customer_id;

ALTER TABLE public.subscriptions
  RENAME COLUMN stripe_subscription_id TO razorpay_subscription_id;

-- ── Add Razorpay plan ID column to subscriptions ─────────────
ALTER TABLE public.subscriptions
  ADD COLUMN razorpay_plan_id TEXT;

-- ── Add trial support columns to profiles ────────────────────
ALTER TABLE public.profiles
  ADD COLUMN trial_ends_at TIMESTAMPTZ,
  ADD COLUMN is_trial BOOLEAN DEFAULT false;

-- ── Create billing_events table ──────────────────────────────
CREATE TABLE public.billing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_subscription_id TEXT,
    amount_paise INT,
    currency TEXT DEFAULT 'INR',
    status TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_billing_events_user ON public.billing_events(user_id);

-- ── Enable RLS on billing_events ─────────────────────────────
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own billing events"
    ON public.billing_events FOR SELECT
    USING (auth.uid() = user_id);
