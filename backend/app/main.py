"""OmniLaunch — FastAPI Application Entry Point."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.rate_limit import limiter
from app.routers import auth, voice, platforms, bundles, posts, billing
from app.routers.sse import router as sse_router


# Rate limiter — protects expensive LLM endpoints from abuse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle."""
    print("🚀 OmniLaunch API starting up...")
    yield
    print("👋 OmniLaunch API shutting down...")


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Clone your writing voice. Launch everywhere.",
    lifespan=lifespan,
)

# Attach limiter to app state (required by slowapi)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(voice.router, prefix="/api/v1", tags=["Voice Profiles"])
app.include_router(platforms.router, prefix="/api/v1", tags=["Platforms"])
app.include_router(bundles.router, prefix="/api/v1", tags=["Launch Bundles"])
app.include_router(posts.router, prefix="/api/v1", tags=["Posts"])
app.include_router(sse_router, prefix="/api/v1", tags=["SSE"])
app.include_router(billing.router, prefix="/api/v1/billing", tags=["Billing"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": settings.app_name, "version": settings.app_version}
