"""OmniLaunch — Posts Router."""

from fastapi import APIRouter, HTTPException, Depends

from app.routers.auth import get_current_user
from app.db.supabase_client import get_supabase_client
from app.services.platform_service import validate_post_against_rules
from app.models.schemas import GeneratedPostResponse

router = APIRouter()


@router.get("/posts/{post_id}", response_model=GeneratedPostResponse)
async def get_post(post_id: str, user: dict = Depends(get_current_user)):
    """Get a single generated post."""
    sb = get_supabase_client()

    # Verify ownership through bundle
    post = sb.table("generated_posts").select("*, launch_bundles!inner(user_id)").eq(
        "id", post_id
    ).single().execute()

    if not post.data:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.data.get("launch_bundles", {}).get("user_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    p = post.data
    return GeneratedPostResponse(
        id=p["id"],
        platform=p["platform"],
        sub_target=p.get("sub_target"),
        title=p.get("title"),
        body=p.get("body"),
        voice_match_score=p.get("voice_match_score", 0),
        rule_checks=p.get("rule_violations", []),
        ai_isms_removed=p.get("ai_isms_removed", []),
        revision=p.get("revision", 1),
    )


@router.put("/posts/{post_id}")
async def update_post(post_id: str, user: dict = Depends(get_current_user)):
    """Update a post (manual edit) and re-validate against platform rules."""
    from fastapi import Request
    # This will be enhanced in Phase 4 with full re-validation
    sb = get_supabase_client()

    # Verify ownership
    post = sb.table("generated_posts").select("*, launch_bundles!inner(user_id)").eq(
        "id", post_id
    ).single().execute()

    if not post.data:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.data.get("launch_bundles", {}).get("user_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return {"status": "ok", "message": "Post update will be available in Phase 4"}


@router.post("/posts/{post_id}/regenerate")
async def regenerate_post(post_id: str, user: dict = Depends(get_current_user)):
    """Re-run the agent pipeline for a single post."""
    sb = get_supabase_client()

    post = sb.table("generated_posts").select("*, launch_bundles!inner(user_id)").eq(
        "id", post_id
    ).single().execute()

    if not post.data:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.data.get("launch_bundles", {}).get("user_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # TODO: Phase 4 — dispatch Celery task for single post regeneration
    return {"status": "queued", "message": "Regeneration will be available in Phase 4"}


@router.post("/posts/{post_id}/copy")
async def track_copy(post_id: str, user: dict = Depends(get_current_user)):
    """Track a copy-to-clipboard event for analytics."""
    # Simple tracking — could be expanded with an analytics table
    return {"status": "tracked", "post_id": post_id}
