"""OmniLaunch — Application Configuration."""

import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    app_name: str = "OmniLaunch"
    app_version: str = "0.1.0"
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    cors_origins: str = "http://localhost:3000"

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # Google Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"

    # JWT — NO default in production. Must be set via env var.
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60 * 24 * 7  # 7 days

    # Razorpay (Billing)
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""
    razorpay_plan_id_pro_monthly: str = ""
    razorpay_plan_id_pro_yearly: str = ""
    razorpay_plan_id_team_monthly: str = ""
    razorpay_plan_id_team_yearly: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}

    def get_cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string or JSON array."""
        raw = self.cors_origins.strip()
        if raw.startswith("["):
            import json
            return json.loads(raw)
        return [o.strip() for o in raw.split(",") if o.strip()]

    def validate_production(self) -> None:
        """Validate that critical settings are configured for production."""
        if not self.debug:
            missing = []
            if not self.jwt_secret:
                missing.append("JWT_SECRET")
            if not self.supabase_url:
                missing.append("SUPABASE_URL")
            if not self.supabase_service_role_key:
                missing.append("SUPABASE_SERVICE_ROLE_KEY")
            if not self.gemini_api_key:
                missing.append("GEMINI_API_KEY")
            if missing:
                raise ValueError(
                    f"Production mode requires these env vars: {', '.join(missing)}"
                )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.validate_production()
    return settings
