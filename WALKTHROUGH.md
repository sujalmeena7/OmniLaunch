# 🚀 OmniLaunch — Implementation Walkthrough (Phases 1-3)

> This document details everything implemented so far across Phases 1-3 of the OmniLaunch project.
> It serves as a reference for onboarding, code review, and planning Phase 4+.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Backend (FastAPI)](#backend-fastapi)
4. [Database (Supabase / PostgreSQL)](#database-supabase--postgresql)
5. [Frontend (Next.js)](#frontend-nextjs)
6. [How to Run Locally](#how-to-run-locally)
7. [What's Next (Phase 4+)](#whats-next-phase-4)

---

## Project Overview

OmniLaunch turns one product description into platform-perfect, human-sounding launch posts for Reddit, Hacker News, Product Hunt, IndieHackers, and Twitter/X — in under 2 minutes.

The system clones a user's writing voice from samples, then generates posts that comply with each platform's specific rules (character limits, flair schedules, forbidden words, formatting) while sounding authentically like the user.

**Current state:** Phases 1-3 are complete. The project scaffold, auth flow, dashboard shell, Voice Lab, platform rulebook engine, and all supporting UI are functional. The LangGraph agent pipeline (Phase 4) is stubbed but not yet wired.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) + TypeScript | 16.2.6 |
| Styling | Tailwind CSS + CSS Variables (dark theme) | v4 |
| State Management | Zustand | 5.0.13 |
| Animations | Framer Motion | 12.38.0 |
| Icons | Lucide React | 1.14.0 |
| Backend | FastAPI + Python | 0.115.12 / 3.12 |
| Validation | Pydantic + Pydantic Settings | 2.11.2 / 2.9.1 |
| Database | Supabase (PostgreSQL + pgvector) | — |
| Auth | Supabase Auth (JWT) | — |
| LLM | Google Gemini 2.5 Flash | google-generativeai 0.8.5 |
| Task Queue | Celery + Redis (configured, not yet active) | 5.5.2 |
| HTTP Client | httpx | 0.28.1 |

---

## Backend (FastAPI)

### Core Infrastructure

**Entry Point:** `backend/app/main.py`
- FastAPI app with CORS middleware (allows `localhost:3000`)
- Lifespan hooks for startup/shutdown logging
- Health check at `GET /api/health`
- All routers registered under `/api/v1/`

**Configuration:** `backend/app/config.py`
- Pydantic Settings class loading from `.env` file
- Settings: app name/version, Supabase credentials, Gemini API key, Redis URL, JWT config, Stripe keys
- Cached via `@lru_cache` for performance

**Supabase Client:** `backend/app/db/supabase_client.py`
- `get_supabase_client()` — service role key (bypasses RLS, used for admin operations)
- `get_supabase_public_client()` — anon key (respects RLS, used for auth operations)

**Pydantic Schemas:** `backend/app/models/schemas.py`
- Request models: `SignupRequest`, `LoginRequest`, `TrainVoiceRequest`, `GenerateBundleRequest`, `CreateCheckoutRequest`
- Response models: `AuthResponse`, `UserProfile`, `VoiceProfileResponse`, `PlatformRuleResponse`, `BundleResponse`, `BundleStatusResponse`, `GeneratedPostResponse`
- Nested models: `VoiceSample`, `ToneManifesto`, `ProductInfo`, `LaunchTarget`, `RuleCheck`

---

### Auth Router (`/api/v1/auth/`)

**File:** `backend/app/routers/auth.py`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/signup` | POST | Creates Supabase auth user, inserts profile row, creates free subscription, returns tokens |
| `/auth/login` | POST | Authenticates via Supabase `sign_in_with_password`, fetches profile, returns tokens |
| `/auth/refresh` | POST | Refreshes an expired access token using the refresh token |
| `/auth/me` | GET | Returns the authenticated user's profile (protected) |

**Auth Dependency:** `get_current_user`
- Extracts Bearer token from `Authorization` header
- Validates against Supabase Auth via `sb.auth.get_user(token)`
- Returns `{"id": ..., "email": ...}` dict
- Used by all protected endpoints

**Signup Flow:**
1. Create auth user in Supabase
2. Insert profile row (display_name, plan=free, launches_remaining=3) using service role client
3. Insert subscription row (plan=free, status=active, launches_per_month=3)
4. Return access_token + refresh_token + user profile

---

### Voice Profiles Router (`/api/v1/`)

**File:** `backend/app/routers/voice.py`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/train-voice` | POST | Analyzes writing samples → creates voice profile with Tone Manifesto |
| `/voice-profiles` | GET | Lists all voice profiles for the authenticated user |
| `/voice-profiles/{id}` | GET | Fetches a specific profile with full manifesto |
| `/voice-profiles/{id}` | DELETE | Removes a voice profile |

**Training Flow:**
1. Receive samples (text or URL, 1-20 samples)
2. Call `analyze_voice_samples()` service
3. Store profile in `voice_profiles` table with manifesto JSON, sample count, confidence
4. Return the created profile

---

### Voice Analysis Service

**File:** `backend/app/services/voice_service.py`

**Two analysis paths:**

**1. Gemini-Powered Analysis** (when `GEMINI_API_KEY` is set):
- Sends all samples to Gemini with a structured prompt
- Requests JSON output matching the Tone Manifesto schema
- Strips code fences from response if present
- Parses JSON into manifesto dict
- Confidence = `min(0.95, 0.5 + sample_count * 0.09)`

**2. Heuristic Fallback** (no API key):
- Splits text into sentences, calculates average length
- Detects emoji usage via Unicode regex
- Scores formality based on informal markers (hey, lol, btw, gonna, etc.)
- Detects first-person preference (I vs we)
- Identifies AI-ism patterns already present in samples
- Confidence = `min(0.7, 0.3 + sample_count * 0.08)`

**Tone Manifesto Fields:**
- `sentence_structure` — short_punchy / long_flowing / mixed
- `avg_sentence_length` — word count per sentence
- `vocabulary_level` — simple / accessible_technical / highly_technical / academic
- `technicality_score` — 0.0 to 1.0
- `emoji_usage` — none / minimal / moderate / heavy
- `emoji_examples` — actual emojis found
- `hashtag_usage` — none / minimal / moderate / heavy
- `humor_level` — none / dry_wit / casual_humor / very_funny
- `formality` — 0.0 (very casual) to 1.0 (very formal)
- `first_person_preference` — I / we / mixed / none
- `call_to_action_style` — none / soft_ask / direct / aggressive
- `forbidden_patterns` — phrases this person would never use
- `signature_phrases` — distinctive patterns unique to the writer
- `paragraph_length` — 1 sentence / 2-3 sentences / 4+ sentences
- `opening_style` — direct_hook / story / question / greeting
- `closing_style` — soft_cta / question / summary / none

**AI-ism Detection Patterns (20 built-in):**
- "in today's fast-paced world", "unlock your potential", "dive into", "leverage", "utilize", "streamline", "revolutionize", "game-changer", "cutting-edge", "state-of-the-art", "empower", "seamlessly", "robust", "holistic", "synergy", "paradigm shift", "disruptive", "innovative solution", "next-generation", "best-in-class"

---

### Platform Rules Router (`/api/v1/platforms/`)

**File:** `backend/app/routers/platforms.py`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/platforms` | GET | Lists all active platform rules |
| `/platforms/{platform}/rules` | GET | Gets rules for a specific platform (optional `?sub_target=`) |
| `/platforms/validate` | POST | Validates title+body against a platform's rulebook |

**Validation Response:**
```json
{
  "platform": "reddit",
  "sub_target": "r/SaaS",
  "checks": [
    { "rule": "title_length", "status": "pass", "detail": "82/300 characters" },
    { "rule": "forbidden_words", "status": "pass", "detail": "No forbidden words detected" },
    { "rule": "flair_showcase", "status": "warning", "detail": "Flair 'Showcase' required. Note: ..." }
  ],
  "passed": 2,
  "total": 3,
  "all_passed": false
}
```

---

### Platform Validation Engine

**File:** `backend/app/services/platform_service.py`

**Checks performed by `validate_post_against_rules()`:**

| Check | Logic |
|-------|-------|
| Title length | Accounts for prefix (e.g., "Show HN:"). Pass if ≤ max, warning if ≤ 110% of max, fail otherwise |
| Body length | Simple character count against max_body_length |
| Prefix enforcement | Checks if title starts with required prefix (e.g., "Show HN:") |
| Forbidden words | Case-insensitive scan of title+body against forbidden word list |
| Required flair | Detects `flair:Name` elements, adds schedule warnings if applicable |
| Link placement | Checks for `link_in_url_field` requirement |
| Tech stack mention | Scans for common tech keywords when `include_tech_stack` is required |
| Tagline length | Product Hunt specific — checks against `tagline_max` in formatting_rules |

**Day-based warnings** (`get_day_based_warnings()`):
- Checks current day against schedule_notes
- Warns if posting on a day that doesn't match flair schedule

---

### Launch Bundles Router (`/api/v1/`)

**File:** `backend/app/routers/bundles.py`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/generate-launch-bundle` | POST | Creates bundle record, decrements launches, returns bundle_id + stream_url |
| `/bundles` | GET | Lists all bundles for the user |
| `/bundles/{id}` | GET | Fetches bundle with all generated posts |

**Generation Flow (current — Phase 4 will add Celery dispatch):**
1. Check user has launches remaining (403 if not)
2. Verify voice profile exists and belongs to user
3. Insert bundle record with status "pending"
4. Call `decrement_launches` RPC
5. Return bundle_id + estimated time + stream URL
6. (Phase 4: dispatch Celery task → LangGraph pipeline)

---

### Posts Router (`/api/v1/posts/`)

**File:** `backend/app/routers/posts.py`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/posts/{id}` | GET | Fetches a single post (verifies ownership through bundle) |
| `/posts/{id}` | PUT | Stub — manual edit + re-validate (Phase 4) |
| `/posts/{id}/regenerate` | POST | Stub — re-run agent pipeline for one post (Phase 4) |
| `/posts/{id}/copy` | POST | Tracks copy-to-clipboard event |

---

## Database (Supabase / PostgreSQL)

### Schema (`supabase/migrations/001_initial_schema.sql`)

**Tables:**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User profiles (extends auth.users) | id, display_name, email, plan, launches_remaining |
| `subscriptions` | Billing/plan management | user_id, plan, stripe_customer_id, status, launches_per_month |
| `voice_profiles` | Voice identity storage | user_id, name, tone_manifesto (JSONB), style_embedding (VECTOR(768)), confidence |
| `platform_rules` | Platform rulebooks | platform, sub_target, prefix, forbidden_words, required_elements, max lengths, formatting_rules |
| `launch_bundles` | Generated bundle records | user_id, voice_profile_id, product info, status, tech_stack |
| `generated_posts` | Individual generated posts | bundle_id, platform, title, body, voice_match_score, rule_violations, ai_isms_removed |

**Row Level Security:**
- All tables have RLS enabled
- Users can only CRUD their own profiles, subscriptions, voice profiles, and bundles
- Generated posts are readable only if the parent bundle belongs to the user
- Platform rules are publicly readable (no auth required)

**Indexes:**
- `idx_voice_profiles_user` — voice_profiles(user_id)
- `idx_launch_bundles_user` — launch_bundles(user_id)
- `idx_generated_posts_bundle` — generated_posts(bundle_id)
- `idx_subscriptions_user` — subscriptions(user_id)
- `idx_platform_rules_platform` — platform_rules(platform, sub_target)

### Functions (`supabase/migrations/002_functions.sql`)

| Function | Purpose |
|----------|---------|
| `decrement_launches(user_id)` | Atomically decrements launches_remaining (floors at 0) |
| `reset_monthly_launches()` | Resets all users' launches based on their subscription tier |

### Seed Data (`supabase/seed.sql`)

**7 platform rules pre-loaded:**

| Platform | Sub-target | Key Rules |
|----------|-----------|-----------|
| Hacker News | — | Prefix "Show HN:", 80 char title, no markdown, forbidden: revolutionary/game-changer/best/amazing/incredible/disruptive/cutting-edge |
| Product Hunt | — | 60 char tagline, 260 char description, requires media, emoji-friendly |
| Reddit | r/SaaS | Showcase flair (Tues/Sat only), 300 char title, forbidden: "best tool ever"/"you need this"/"must-have"/"no-brainer" |
| Reddit | r/webdev | Showoff Saturday flair, tech stack required, 300 char title |
| Reddit | r/startups | Share Your Startup flair, weekly threads |
| IndieHackers | — | 100 char title, markdown allowed, founder-to-founder tone |
| Twitter/X | — | 280 char body, max 3 hashtags, threads allowed |

---

## Frontend (Next.js)

### Design System (`src/app/globals.css`)

**Dark theme with CSS custom properties:**
- Brand palette: indigo-to-violet gradient (#5c7cfa → #845ef7 → #e64980)
- Surfaces: near-black backgrounds (#0a0a0f, #12121a, #1a1a2e)
- Text hierarchy: primary (#f0f0f5), secondary (#9494a8), muted (#5a5a72)
- Accent colors: green (success), red (error), amber (warning), cyan (info)
- Shadows with glow effects for brand elements
- Border system: subtle (12% opacity) and default (20% opacity)
- Radius scale: sm(6px), md(10px), lg(16px), xl(24px), full(9999px)
- Typography: Inter (sans) + JetBrains Mono (code)

**Animations:**
- `fadeIn` — opacity 0→1 + translateY 8px→0
- `slideInRight` — opacity 0→1 + translateX 16px→0
- `pulse-glow` — pulsing box-shadow for brand elements
- `shimmer` — loading skeleton effect

### Route Structure

```
src/app/
├── layout.tsx                          # Root layout (metadata, global CSS)
├── page.tsx                            # Landing page (marketing)
├── globals.css                         # Design system
├── login/page.tsx                      # Login form
├── signup/page.tsx                     # Signup form
└── (dashboard)/                        # Route group (no URL segment)
    ├── layout.tsx                      # Dashboard shell (sidebar + topbar + auth guard)
    └── dashboard/
        ├── page.tsx                    # Dashboard home
        ├── voice-lab/page.tsx          # Voice training UI
        ├── launch/page.tsx             # Split-view workspace
        ├── bundles/page.tsx            # Bundle history
        ├── bundles/[id]/page.tsx       # Bundle detail
        └── settings/page.tsx           # Account settings
```

### Landing Page (`/`)

- Animated hero section with Framer Motion (fade + slide up)
- Gradient text effect on headline ("Sound like you.")
- Ambient radial glow background
- "From 2 hours to 2 minutes" badge
- Platform badges: HN, Reddit, Product Hunt, IndieHackers, Twitter/X
- Feature cards with hover effects: Voice Cloning, Platform Compliance, Zero AI Slop
- CTA: "Start Free — 3 Launches Included"
- Nav with Log In / Get Started Free buttons

### Auth Pages (`/login`, `/signup`)

**Login:**
- Email + password form
- Error display with red accent styling
- Loading state on submit button
- Redirects to `/dashboard` on success
- Link to signup

**Signup:**
- Display name + email + password (min 8 chars)
- Same styling and error handling as login
- "3 free launches included — no credit card needed" messaging
- Redirects to `/dashboard` on success

### Dashboard Layout (`(dashboard)/layout.tsx`)

**Auth Guard:**
- Checks for token in localStorage on mount
- If no token → redirect to `/login`
- If token exists but no user in store → calls `GET /auth/me`
- If API call fails → clears token, redirects to login
- Shows loading spinner while checking

**Sidebar:**
- Collapsible (240px expanded, 64px collapsed)
- Logo: 🚀 OmniLaunch (brand-colored "Launch")
- Nav items: Home (🏠), Launch (🚀), Voice Lab (🧬), Bundles (📦), Settings (⚙️)
- Active route highlighting with brand color background
- Collapse/expand toggle button at bottom

**Topbar:**
- Current page title (derived from route)
- User info: display name, plan badge, launches remaining count
- Log out button

### Dashboard Home (`/dashboard`)

- Welcome message with user's display name
- Quick action cards (3-column grid):
  - New Launch → `/dashboard/launch`
  - Voice Lab → `/dashboard/voice-lab`
  - Platforms → `/dashboard/launch`
- Recent Launches section:
  - Fetches bundles from API on mount
  - Displays as clickable rows with product name, date, status badge
  - Status colors: green (complete), amber (generating), gray (pending), red (failed)
  - Empty state with CTA button when no bundles exist

### Voice Lab (`/dashboard/voice-lab`)

**Two-column layout:**

**Left — Training Form:**
- Profile name input (default: "My Voice")
- Writing samples list (1-10 samples):
  - Each sample has a type selector (Text / URL)
  - Text type: multi-line textarea
  - URL type: URL input field
  - Add/remove sample buttons
- Success/error message display
- "🧬 Train Voice Profile" submit button with loading state

**Right — Existing Profiles:**
- Lists all user's voice profiles
- Each profile card shows: name, confidence %, sample count, creation date
- Click to select as active (highlighted border)
- Delete button per profile
- Expanded Tone Manifesto preview when active:
  - Grid showing: structure, formality, emoji, humor, vocab, opening style
  - Signature phrases list

### Launch Workspace (`/dashboard/launch`)

**Split-view layout (380px left + flexible right):**

**Left Panel — Product Form:**
- Voice profile dropdown selector (with warning if none exist)
- Product name input
- Product description textarea (5 rows)
- Product URL input
- Target audience input
- Tech stack input (comma-separated)
- Platform selection: pill buttons for each platform from DB, toggle on/off
- Validation: requires voice, name, description (≥10 chars), ≥1 platform
- "🚀 Generate Bundle" button with gradient + glow shadow

**Right Panel — Preview:**
- Empty state: instructions + rocket emoji
- Generating state: spinner + "Generating your launch posts..."
- Generated state:
  - Platform tabs (one per generated post)
  - Post content display (title + body, pre-wrapped)
  - Validation gutter below post:
    - Lists all rule checks with ✅/⚠️/❌ icons
    - Shows passed/total count
  - Action buttons: 📋 Copy

**Generation Flow:**
1. Calls `POST /generate-launch-bundle`
2. Receives bundle_id
3. Polls `GET /bundles/{id}` every 2 seconds (up to 30 attempts)
4. On completion: displays posts in tabs
5. On failure/timeout: shows error message

### Bundles List (`/dashboard/bundles`)

- Fetches all bundles on mount
- Displays as clickable cards: product name, description preview (80 chars), date/time, status badge
- Hover effect (border highlight + lift)
- Empty state with "Create Launch Bundle" CTA
- Click navigates to `/dashboard/bundles/[id]`

### Bundle Detail (`/dashboard/bundles/[id]`)

- Back navigation link
- Header: product name, creation date, post count, status badge
- Platform tabs (one per post)
- Post content area: title (bold, 16px) + body (pre-wrapped)
- Validation sidebar (280px):
  - Voice Match percentage (large, color-coded: green ≥85%, amber <85%)
  - Revision number
  - Rule checks list with status icons
  - AI-isms removed (red pills)
- Copy button with "✓ Copied!" feedback (2s timeout)
- Pending/generating state messaging

### Settings (`/dashboard/settings`)

- Profile section: name, email, plan, launches remaining
- Subscription section: current plan display, "Upgrade to Pro" button for free users
- Danger zone: Log out button (red-themed)

### Shared Infrastructure

**API Client (`src/lib/api.ts`):**
- Singleton `ApiClient` class exported as `api`
- Token management: `setToken()`, `getToken()`, `clearToken()` (localStorage-backed)
- Generic `request<T>()` method: adds auth header, handles errors, parses JSON
- Typed methods:
  - Auth: `signup()`, `login()`, `getMe()`
  - Voice: `trainVoice()`, `listVoiceProfiles()`, `getVoiceProfile()`, `deleteVoiceProfile()`
  - Platforms: `listPlatforms()`, `getPlatformRules()`, `validatePost()`
  - Bundles: `generateBundle()`, `listBundles()`, `getBundle()`

**Zustand Store (`src/stores/appStore.ts`):**
- Auth state: `user`, `isAuthenticated`, `setUser()`, `logout()`
- Voice state: `voiceProfiles`, `activeVoice`, `setVoiceProfiles()`, `setActiveVoice()`
- Platform state: `platformRules`, `setPlatformRules()`
- UI state: `sidebarOpen`, `toggleSidebar()`

**TypeScript Types (`src/types/index.ts`):**
- `UserProfile` — id, email, display_name, plan, launches_remaining
- `AuthResponse` — tokens + user
- `VoiceSample` — type (url/text), value, platform
- `ToneManifesto` — all 16 voice analysis fields
- `VoiceProfile` — id, name, manifesto, sample_count, confidence, is_active, timestamps
- `PlatformRule` — all rule fields including formatting_rules
- `RuleCheck` — rule, status (pass/warning/fail), detail
- `GeneratedPost` — platform, title, body, voice_match_score, rule_checks, ai_isms_removed
- `LaunchBundle` — id, product_name, status, posts array, timestamps
- `PLATFORM_META` — display metadata (label, icon emoji, color) for each platform

**Next.js Config (`next.config.ts`):**
- API proxy rewrite: `/api/v1/*` → `http://localhost:8000/api/v1/*`
- Enables frontend to call backend without CORS issues in development

---

## How to Run Locally

### Prerequisites
- Node.js 18+
- Python 3.12+
- Supabase project (or local Supabase via Docker)
- Redis (for Celery, optional in Phase 1-3)

### Backend

```bash
cd backend
cp .env.example .env
# Fill in your Supabase URL, keys, and optionally Gemini API key

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Database

1. Create a Supabase project (or run `supabase start` locally)
2. Run the migration: `supabase/migrations/001_initial_schema.sql`
3. Run the functions: `supabase/migrations/002_functions.sql`
4. Seed platform rules: `supabase/seed.sql`

---

## What's Next (Phase 4+)

### Phase 4 — LangGraph Agent Pipeline + SSE Streaming

**What needs to be built:**
- `backend/app/agents/graph.py` — LangGraph state machine orchestrating all 4 agents
- `backend/app/agents/voice_trainer.py` — Voice Training Agent (enhance current service)
- `backend/app/agents/context_researcher.py` — Context Research Agent (fetches + merges platform rules)
- `backend/app/agents/drafter.py` — Drafting Agent (generates posts per platform using voice + rules)
- `backend/app/agents/humanizer.py` — Humanizer/Critique Agent (AI-ism detection, voice scoring, rule validation, revision loop)
- Celery task dispatch in `bundles.py` (replace the TODO comment)
- SSE endpoint at `GET /bundles/{id}/status` for real-time progress
- Frontend SSE consumer (replace polling with EventSource)

**Integration points already prepared:**
- Bundle creation endpoint exists and creates DB records
- Voice profiles stored with full Tone Manifesto JSON
- Platform rules queryable via service
- Validation engine ready for the Humanizer agent to call
- Frontend already renders posts in tabs with validation gutter
- `stream_url` field returned in bundle creation response

### Phase 5 — Split-View UI Polish

- Component extraction (ProductForm, PostPreview, ValidationGutter, PlatformTabs)
- VoiceMatchMeter animated gauge
- Real-time validation as user types
- Inline post editing
- Regenerate single post button (wired to agent)

### Phase 6 — Polish & Billing

- Stripe checkout integration (schemas already defined)
- Rate limiting
- Error boundaries and retry logic
- Loading skeletons (shimmer animation ready)
- Responsive design
- Keyboard shortcuts
