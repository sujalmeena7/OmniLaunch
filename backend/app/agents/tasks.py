"""OmniLaunch — Celery Tasks for Agent Pipeline.

Defines the async task that runs the LangGraph agent pipeline
in a background worker process.
"""

import json
import redis
from celery import Celery
from app.config import get_settings
from app.db.supabase_client import get_supabase_client

settings = get_settings()

# Celery app
celery_app = Celery(
    "omnilaunch",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=180,  # 3 minute hard limit
    task_soft_time_limit=150,  # 2.5 minute soft limit
)

# Redis client for SSE progress events
_redis_client = None


def get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(settings.redis_url)
    return _redis_client


def publish_progress(bundle_id: str, platform: str, status: str, detail: str):
    """Publish a progress event to Redis pub/sub for SSE consumption."""
    r = get_redis()
    event = json.dumps({
        "bundle_id": bundle_id,
        "platform": platform,
        "status": status,
        "detail": detail,
    })
    r.publish(f"bundle:{bundle_id}:progress", event)


@celery_app.task(name="generate_bundle", bind=True, max_retries=1)
def generate_bundle_task(self, bundle_id: str, request_data: dict):
    """
    Celery task: run the LangGraph agent pipeline for a launch bundle.

    This is dispatched from the /generate-launch-bundle endpoint.
    Progress events are published to Redis for SSE streaming.
    """
    import asyncio
    from datetime import datetime, timezone
    from app.agents.graph import run_langgraph_pipeline
    from app.services.platform_service import validate_post_against_rules

    voice_profile_id = request_data.get("voice_profile_id", "")
    product = request_data.get("product", {})
    targets = request_data.get("targets", [])

    def progress_callback(platform: str, status: str, detail: str):
        publish_progress(bundle_id, platform, status, detail)

    try:
        sb = get_supabase_client()

        # Fetch voice profile
        voice_result = sb.table("voice_profiles").select(
            "tone_manifesto, style_embedding"
        ).eq("id", voice_profile_id).maybe_single().execute()

        if not voice_result or not voice_result.data:
            sb.table("launch_bundles").update({
                "status": "failed",
                "error_message": "Voice profile not found",
            }).eq("id", bundle_id).execute()
            publish_progress(bundle_id, "all", "failed", "Voice profile not found")
            return {"status": "failed", "posts": [], "error": "Voice profile not found"}

        tone_manifesto = voice_result.data["tone_manifesto"]
        style_embedding = voice_result.data.get("style_embedding")

        # Update bundle status to generating
        sb.table("launch_bundles").update({"status": "generating"}).eq("id", bundle_id).execute()
        publish_progress(bundle_id, "all", "started", f"Generating posts for {len(targets)} platforms")

        # Run the LangGraph pipeline
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            results = loop.run_until_complete(
                run_langgraph_pipeline(
                    targets=targets,
                    tone_manifesto=tone_manifesto,
                    product=product,
                    style_embedding=style_embedding,
                    progress_callback=progress_callback,
                )
            )
        finally:
            loop.close()

        # Store generated posts in DB
        generated_posts = []
        for i, post_data in enumerate(results):
            target = targets[i] if i < len(targets) else {}
            platform = target.get("platform", "unknown")
            sub_target = target.get("sub_target")

            if "error" in post_data:
                generated_posts.append(post_data)
                continue

            # Run platform validation on the generated post
            platform_rules = {
                "platform": platform,
                "sub_target": sub_target,
                "max_title_length": None,
                "max_body_length": None,
                "prefix": None,
                "forbidden_words": [],
                "required_elements": [],
                "formatting_rules": {},
            }

            # Fetch actual platform rules from DB for validation
            try:
                rules_query = sb.table("platform_rules").select("*").eq("platform", platform)
                if sub_target:
                    rules_query = rules_query.eq("sub_target", sub_target)
                else:
                    rules_query = rules_query.is_("sub_target", "null")
                rules_result = rules_query.maybe_single().execute()
                if rules_result and rules_result.data:
                    platform_rules.update(rules_result.data)
            except Exception:
                pass  # Use defaults if fetch fails

            rule_checks = validate_post_against_rules(
                platform_rules,
                post_data.get("title", ""),
                post_data.get("body", ""),
            )
            rule_pass_count = sum(1 for c in rule_checks if c["status"] == "pass")
            rule_total_count = len(rule_checks)

            post_record = sb.table("generated_posts").insert({
                "bundle_id": bundle_id,
                "platform": platform,
                "sub_target": sub_target,
                "title": post_data.get("title", ""),
                "body": post_data.get("body"),
                "voice_match_score": post_data.get("voice_match_score", 0),
                "rule_violations": rule_checks,
                "rule_pass_count": rule_pass_count,
                "rule_total_count": rule_total_count,
                "ai_isms_removed": post_data.get("ai_isms_removed", []),
                "revision": post_data.get("revision", 1),
            }).execute()

            generated_posts.append(post_record.data[0] if post_record.data else post_data)

        # Update bundle status to complete
        sb.table("launch_bundles").update({
            "status": "complete",
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", bundle_id).execute()

        publish_progress(bundle_id, "all", "complete", f"Generated {len(generated_posts)} posts")

        return {"status": "complete", "posts": generated_posts, "error": None}

    except Exception as exc:
        # Mark bundle as failed
        sb = get_supabase_client()
        sb.table("launch_bundles").update({
            "status": "failed",
            "error_message": str(exc),
        }).eq("id", bundle_id).execute()

        publish_progress(bundle_id, "all", "failed", str(exc))

        # Retry once
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=5)

        raise
