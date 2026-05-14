# 🚀 OmniLaunch

**Turn one product description into platform-perfect, human-sounding launch posts — in under 2 minutes.**

OmniLaunch clones your writing voice from samples, then generates compliant posts for Reddit, Hacker News, Product Hunt, IndieHackers, and Twitter/X. No generic AI slop — every post sounds like you wrote it.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## Features

- **Voice Cloning** — Feed it your past posts and it learns your tone, humor, sentence structure, and vocabulary
- **Platform Compliance** — Enforces character limits, flair rules, forbidden words, and formatting per platform
- **AI-ism Detection** — Strips out "leverage", "game-changer", and 50+ other AI tells
- **Real-time Generation** — SSE streaming shows progress as each platform post is generated
- **Dark Mode** — Full dark/light theme toggle with system preference detection
- **Command Palette** — ⌘K search across bundles, voice profiles, and pages
- **Split-View Workspace** — Product form on the left, live preview with validation on the right

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                          │
│  Dashboard · Voice Lab · Launch Workspace · Bundle History   │
├─────────────────────────────────────────────────────────────┤
│                    FastAPI Backend                           │
│  Auth · Voice Training · Bundle Generation · Validation     │
├─────────────────────────────────────────────────────────────┤
│              LangGraph Multi-Agent Pipeline                  │
│  Context Research → Drafting → Humanizer (revision loop)    │
├─────────────────────────────────────────────────────────────┤
│                 Supabase (PostgreSQL)                        │
│  Profiles · Voice Profiles · Platform Rules · Bundles       │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, Zustand, Framer Motion |
| Backend | FastAPI, Python 3.12, Pydantic |
| AI/Agents | LangGraph, Google Gemini 2.5 Flash |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth (JWT) |
| Queue | Celery + Redis |
| Testing | Vitest, fast-check |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12+
- A [Supabase](https://supabase.com) project
- Redis (optional, for task queue)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your Supabase URL, keys, and Gemini API key

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Database Setup

1. Create a Supabase project (or run `supabase start` locally)
2. Run the schema migration:
   ```sql
   -- Execute: supabase/migrations/001_initial_schema.sql
   ```
3. Run the database functions:
   ```sql
   -- Execute: supabase/migrations/002_functions.sql
   ```
4. Seed platform rules:
   ```sql
   -- Execute: supabase/seed.sql
   ```

## Project Structure

```
OmniLaunch/
├── frontend/                   # Next.js app
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   ├── components/         # React components
│   │   │   ├── dashboard/      # Sidebar, Header, Cards
│   │   │   ├── landing/        # Marketing page sections
│   │   │   └── launch/         # Launch workspace components
│   │   ├── stores/             # Zustand state management
│   │   ├── lib/                # API client, hooks
│   │   └── types/              # TypeScript interfaces
│   └── vitest.config.ts        # Test configuration
│
├── backend/                    # FastAPI app
│   ├── app/
│   │   ├── routers/            # API route handlers
│   │   ├── agents/             # LangGraph agent pipeline
│   │   ├── services/           # Business logic
│   │   ├── models/             # Pydantic schemas
│   │   └── db/                 # Supabase client
│   └── requirements.txt
│
├── supabase/                   # Database
│   ├── migrations/             # SQL schema + functions
│   └── seed.sql                # Platform rules seed data
│
└── .kiro/specs/                # Feature specifications
```

## Supported Platforms

| Platform | Key Rules |
|----------|-----------|
| Hacker News | "Show HN:" prefix, 80 char title, no markdown |
| Product Hunt | 60 char tagline, 260 char description, emoji-friendly |
| Reddit (r/SaaS) | Showcase flair (Tues/Sat), 300 char title |
| Reddit (r/webdev) | Showoff Saturday, tech stack required |
| IndieHackers | 100 char title, founder-to-founder tone |
| Twitter/X | 280 char body, max 3 hashtags |

## How It Works

1. **Train Your Voice** — Paste URLs or text from your past posts. OmniLaunch analyzes your writing style and creates a Tone Manifesto.

2. **Describe Your Product** — Enter your product name, description, URL, and target audience.

3. **Select Platforms** — Choose which platforms to generate posts for.

4. **Generate** — The multi-agent pipeline drafts posts matching your voice while respecting each platform's rules. A humanizer agent strips AI-isms and validates compliance.

5. **Review & Copy** — Preview each post with a validation gutter showing rule checks, voice match score, and any warnings.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Model name (default: `gemini-2.5-flash`) |
| `REDIS_URL` | Redis connection URL |
| `CORS_ORIGINS` | Allowed CORS origins (JSON array) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

## Scripts

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run tests (Vitest) |
| `npm run lint` | Run ESLint |

### Backend

| Command | Description |
|---------|-------------|
| `uvicorn app.main:app --reload` | Start dev server |
| `celery -A app.agents.tasks worker` | Start Celery worker |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

Built with ☕ and too many late nights by [@sujalmeena7](https://github.com/sujalmeena7)
