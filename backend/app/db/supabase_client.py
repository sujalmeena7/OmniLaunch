"""OmniLaunch — Supabase Client."""

from supabase import create_client, Client
from app.config import get_settings


def get_supabase_client() -> Client:
    """Returns a Supabase client using the service role key (bypasses RLS)."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_supabase_public_client() -> Client:
    """Returns a Supabase client using the anon key (respects RLS)."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)
