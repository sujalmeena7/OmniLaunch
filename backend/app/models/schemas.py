"""OmniLaunch — Pydantic Schemas for request/response validation."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    display_name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: dict


class UserProfile(BaseModel):
    id: str
    email: str
    display_name: str | None
    plan: str
    launches_remaining: int
    avatar_url: str | None = None


# ── Voice Profiles ────────────────────────────────────────────

class VoiceSample(BaseModel):
    type: str = Field(description="'url' or 'text'")
    value: str
    platform: str | None = None


class TrainVoiceRequest(BaseModel):
    name: str = "Default Voice"
    samples: list[VoiceSample] = Field(min_length=1, max_length=20)


class UpdateVoiceProfileRequest(BaseModel):
    """Request body for PUT /voice-profiles/{id}."""
    samples: list[VoiceSample] = Field(min_length=1, max_length=20)
    name: str | None = None


class ToneManifesto(BaseModel):
    sentence_structure: str = "mixed"
    avg_sentence_length: int = 15
    vocabulary_level: str = "accessible_technical"
    technicality_score: float = 0.5
    emoji_usage: str = "minimal"
    emoji_examples: list[str] = []
    hashtag_usage: str = "none"
    humor_level: str = "none"
    formality: float = 0.5
    first_person_preference: str = "I"
    call_to_action_style: str = "soft_ask"
    forbidden_patterns: list[str] = []
    signature_phrases: list[str] = []
    paragraph_length: str = "2-3 sentences"
    opening_style: str = "direct_hook"
    closing_style: str = "soft_cta"


class VoiceProfileResponse(BaseModel):
    id: str
    name: str
    tone_manifesto: dict
    sample_count: int
    confidence: float
    is_active: bool
    created_at: str
    updated_at: str


class VoiceProfileListResponse(BaseModel):
    profiles: list[VoiceProfileResponse]


# ── Platform Rules ────────────────────────────────────────────

class PlatformRuleResponse(BaseModel):
    id: str
    platform: str
    sub_target: str | None
    display_name: str
    prefix: str | None
    forbidden_words: list[str]
    required_elements: list[str]
    max_title_length: int | None
    max_body_length: int | None
    formatting_rules: dict
    schedule_notes: str | None


class PlatformListResponse(BaseModel):
    platforms: list[PlatformRuleResponse]


# ── Launch Bundles ────────────────────────────────────────────

class ProductInfo(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=10, max_length=5000)
    url: str | None = None
    target_audience: str | None = None
    tech_stack: list[str] = []


class LaunchTarget(BaseModel):
    platform: str
    sub_target: str | None = None


class GenerateBundleRequest(BaseModel):
    voice_profile_id: str
    product: ProductInfo
    targets: list[LaunchTarget] = Field(min_length=1, max_length=10)


class RuleCheck(BaseModel):
    rule: str
    status: str  # pass | warning | fail
    detail: str


class GeneratedPostResponse(BaseModel):
    id: str
    platform: str
    sub_target: str | None
    title: str | None
    body: str | None
    voice_match_score: float
    rule_checks: list[dict]
    ai_isms_removed: list[str]
    revision: int
    updated_at: str | None = None


class BundleResponse(BaseModel):
    id: str
    product_name: str
    status: str
    posts: list[GeneratedPostResponse] = []
    created_at: str
    completed_at: str | None = None


class BundleStatusResponse(BaseModel):
    bundle_id: str
    status: str
    estimated_time_seconds: int = 45
    stream_url: str | None = None


# ── Subscriptions / Billing ───────────────────────────────────

class SubscriptionResponse(BaseModel):
    id: str
    plan: str
    status: str
    stripe_customer_id: str | None
    current_period_end: str | None
    launches_per_month: int


class CreateCheckoutRequest(BaseModel):
    plan: str = Field(description="'pro' or 'team'")
    success_url: str
    cancel_url: str
