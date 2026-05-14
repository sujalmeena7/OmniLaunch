"""OmniLaunch — Launch Bundle Router."""

from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks

from app.routers.auth import get_current_user
from app.db.supabase_client import get_supabase_client
from app.rate_limit import limiter
from app.models.schemas import (
    GenerateBundleRequest, BundleResponse, BundleStatusResponse, GeneratedPostResponse
)

router = APIRouter()


@router.post("/generate-launch-bundle", response_model=BundleStatusResponse)
@limiter.limit("5/minute")
async def generate_launch_bundle(
    request: Request,
    req: GenerateBundleRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
):
    """Create a new launch bundle and start async generation."""
    try:
        sb = get_supabase_client()

        # Validate voice_profile_id is not empty
        if not req.voice_profile_id or not req.voice_profile_id.strip():
            raise HTTPException(status_code=400, detail="voice_profile_id is required. Create a voice profile first.")

        # Check launches remaining
        profile = sb.table("profiles").select("launches_remaining").eq(
            "id", user["id"]
        ).single().execute()

        if not profile.data or profile.data["launches_remaining"] <= 0:
            raise HTTPException(
                status_code=403,
                detail="No launches remaining. Upgrade your plan to continue.",
            )

        # Verify voice profile exists and belongs to user
        voice = sb.table("voice_profiles").select("id").eq(
            "id", req.voice_profile_id
        ).eq("user_id", user["id"]).maybe_single().execute()

        if not voice.data:
            raise HTTPException(status_code=404, detail="Voice profile not found. Create one in Voice Lab first.")

        # Create bundle record
        bundle = sb.table("launch_bundles").insert({
            "user_id": user["id"],
            "voice_profile_id": req.voice_profile_id,
            "product_name": req.product.name,
            "product_description": req.product.description,
            "product_url": req.product.url,
            "target_audience": req.product.target_audience,
            "tech_stack": req.product.tech_stack,
            "status": "pending",
        }).execute()

        bundle_id = bundle.data[0]["id"]

        # Decrement launches remaining
        sb.rpc("decrement_launches", {"user_id_input": user["id"]}).execute()

        # Dispatch generation task
        # Try Celery first (production), fall back to FastAPI BackgroundTasks (dev)
        try:
            from app.agents.tasks import generate_bundle_task
            generate_bundle_task.delay(bundle_id, req.model_dump())
        except Exception:
            # Fallback: run pipeline via FastAPI background tasks (no Redis needed)
            import asyncio
            from datetime import datetime, timezone
            from app.agents.graph import run_langgraph_pipeline

            async def _run_inline():
                try:
                    sb_inner = get_supabase_client()

                    # Fetch voice profile
                    voice_result = sb_inner.table("voice_profiles").select(
                        "tone_manifesto, style_embedding"
                    ).eq("id", req.voice_profile_id).maybe_single().execute()

                    if not voice_result or not voice_result.data:
                        sb_inner.table("launch_bundles").update({
                            "status": "failed",
                            "error_message": "Voice profile not found",
                        }).eq("id", bundle_id).execute()
                        return

                    tone_manifesto = voice_result.data["tone_manifesto"]
                    style_embedding = voice_result.data.get("style_embedding")

                    sb_inner.table("launch_bundles").update({"status": "generating"}).eq("id", bundle_id).execute()

                    results = await run_langgraph_pipeline(
                        targets=[t.model_dump() for t in req.targets],
                        tone_manifesto=tone_manifesto,
                        product=req.product.model_dump(),
                        style_embedding=style_embedding,
                    )

                    # Store generated posts
                    for i, post_data in enumerate(results):
                        target = req.targets[i].model_dump() if i < len(req.targets) else {}
                        if "error" in post_data:
                            continue
                        sb_inner.table("generated_posts").insert({
                            "bundle_id": bundle_id,
                            "platform": target.get("platform", "unknown"),
                            "sub_target": target.get("sub_target"),
                            "title": post_data.get("title", ""),
                            "body": post_data.get("body"),
                            "voice_match_score": post_data.get("voice_match_score", 0),
                            "rule_violations": post_data.get("rule_checks", []),
                            "rule_pass_count": post_data.get("rule_pass_count", 0),
                            "rule_total_count": post_data.get("rule_total_count", 0),
                            "ai_isms_removed": post_data.get("ai_isms_removed", []),
                            "revision": post_data.get("revision", 1),
                        }).execute()

                    sb_inner.table("launch_bundles").update({
                        "status": "complete",
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                    }).eq("id", bundle_id).execute()

                except Exception as e:
                    sb_err = get_supabase_client()
                    sb_err.table("launch_bundles").update({
                        "status": "failed",
                        "error_message": str(e)[:500],
                    }).eq("id", bundle_id).execute()

            background_tasks.add_task(_run_inline)

        return BundleStatusResponse(
            bundle_id=bundle_id,
            status="pending",
            estimated_time_seconds=45,
            stream_url=f"/api/v1/bundles/{bundle_id}/status",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bundle creation failed: {str(e)}")


@router.get("/bundles")
async def list_bundles(user: dict = Depends(get_current_user)):
    """List all launch bundles for the current user."""
    sb = get_supabase_client()
    result = sb.table("launch_bundles").select("*").eq(
        "user_id", user["id"]
    ).order("created_at", desc=True).execute()
    return {"bundles": result.data}


@router.get("/bundles/{bundle_id}", response_model=BundleResponse)
async def get_bundle(bundle_id: str, user: dict = Depends(get_current_user)):
    """Get a specific bundle with all generated posts."""
    sb = get_supabase_client()

    bundle = sb.table("launch_bundles").select("*").eq(
        "id", bundle_id
    ).eq("user_id", user["id"]).single().execute()

    if not bundle.data:
        raise HTTPException(status_code=404, detail="Bundle not found")

    posts_result = sb.table("generated_posts").select("*").eq(
        "bundle_id", bundle_id
    ).execute()

    posts = [
        GeneratedPostResponse(
            id=p["id"],
            platform=p["platform"],
            sub_target=p.get("sub_target"),
            title=p.get("title"),
            body=p.get("body"),
            voice_match_score=p.get("voice_match_score", 0),
            rule_checks=p.get("rule_violations", []),
            ai_isms_removed=p.get("ai_isms_removed", []),
            revision=p.get("revision", 1),
            updated_at=p.get("updated_at"),
        )
        for p in posts_result.data
    ]

    b = bundle.data
    return BundleResponse(
        id=b["id"],
        product_name=b["product_name"],
        status=b["status"],
        posts=posts,
        created_at=b["created_at"],
        completed_at=b.get("completed_at"),
    )


@router.post("/bundles/{bundle_id}/posts/{platform}/regenerate")
async def regenerate_single_post(
    bundle_id: str,
    platform: str,
    user: dict = Depends(get_current_user),
):
    """Regenerate a single platform post within an existing bundle."""
    sb = get_supabase_client()

    # Verify bundle exists and belongs to user
    bundle = sb.table("launch_bundles").select("*").eq(
        "id", bundle_id
    ).eq("user_id", user["id"]).single().execute()

    if not bundle.data:
        raise HTTPException(status_code=404, detail="Bundle not found")

    # Check launches remaining
    profile = sb.table("profiles").select("launches_remaining").eq(
        "id", user["id"]
    ).single().execute()

    if not profile.data or profile.data["launches_remaining"] <= 0:
        raise HTTPException(
            status_code=403,
            detail="No launches remaining. Upgrade your plan to continue.",
        )

    # Delete existing post for this platform
    sb.table("generated_posts").delete().eq("bundle_id", bundle_id).eq(
        "platform", platform
    ).execute()

    # Decrement launches remaining
    sb.rpc("decrement_launches", {"user_id_input": user["id"]}).execute()

    # Dispatch single-platform generation task
    try:
        from app.agents.tasks import generate_bundle_task
        generate_bundle_task.delay(bundle_id, {
            "voice_profile_id": bundle.data["voice_profile_id"],
            "product": {
                "name": bundle.data["product_name"],
                "description": bundle.data["product_description"],
                "url": bundle.data.get("product_url"),
                "target_audience": bundle.data.get("target_audience"),
                "tech_stack": bundle.data.get("tech_stack", []),
            },
            "targets": [{"platform": platform, "sub_target": None}],
        })
    except Exception:
        # Fallback: run synchronously (dev mode)
        import asyncio
        from datetime import datetime, timezone
        from app.agents.graph import run_langgraph_pipeline

        sb_inner = get_supabase_client()
        voice_result = sb_inner.table("voice_profiles").select(
            "tone_manifesto, style_embedding"
        ).eq("id", bundle.data["voice_profile_id"]).maybe_single().execute()

        tone_manifesto = voice_result.data["tone_manifesto"] if voice_result and voice_result.data else {}
        style_embedding = voice_result.data.get("style_embedding") if voice_result and voice_result.data else None

        sb_inner.table("launch_bundles").update({"status": "generating"}).eq("id", bundle_id).execute()

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            results = loop.run_until_complete(
                run_langgraph_pipeline(
                    targets=[{"platform": platform, "sub_target": None}],
                    tone_manifesto=tone_manifesto,
                    product={
                        "name": bundle.data["product_name"],
                        "description": bundle.data["product_description"],
                        "url": bundle.data.get("product_url"),
                        "target_audience": bundle.data.get("target_audience"),
                        "tech_stack": bundle.data.get("tech_stack", []),
                    },
                    style_embedding=style_embedding,
                )
            )
        finally:
            loop.close()

        # Store results
        for post_data in results:
            if "error" in post_data:
                continue
            sb_inner.table("generated_posts").insert({
                "bundle_id": bundle_id,
                "platform": platform,
                "sub_target": None,
                "title": post_data.get("title", ""),
                "body": post_data.get("body"),
                "voice_match_score": post_data.get("voice_match_score", 0),
                "rule_violations": post_data.get("rule_checks", []),
                "rule_pass_count": post_data.get("rule_pass_count", 0),
                "rule_total_count": post_data.get("rule_total_count", 0),
                "ai_isms_removed": post_data.get("ai_isms_removed", []),
                "revision": post_data.get("revision", 1),
            }).execute()

        sb_inner.table("launch_bundles").update({
            "status": "complete",
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", bundle_id).execute()

    # Find the new post id (may not exist yet, but return a placeholder)
    posts_result = sb.table("generated_posts").select("id").eq(
        "bundle_id", bundle_id
    ).eq("platform", platform).execute()

    post_id = posts_result.data[0]["id"] if posts_result.data else ""

    return {
        "post_id": post_id,
        "status": "generating",
    }
