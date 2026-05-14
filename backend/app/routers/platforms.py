"""OmniLaunch — Platform Rules Router."""

from fastapi import APIRouter, HTTPException, Query

from app.db.supabase_client import get_supabase_client
from app.models.schemas import PlatformRuleResponse, PlatformListResponse
from app.services.platform_service import validate_post_against_rules

router = APIRouter()


@router.get("/platforms", response_model=PlatformListResponse)
async def list_platforms():
    """List all supported platforms and their rules."""
    sb = get_supabase_client()
    result = sb.table("platform_rules").select("*").eq("is_active", True).execute()

    platforms = [
        PlatformRuleResponse(
            id=p["id"],
            platform=p["platform"],
            sub_target=p.get("sub_target"),
            display_name=p["display_name"],
            prefix=p.get("prefix"),
            forbidden_words=p.get("forbidden_words", []),
            required_elements=p.get("required_elements", []),
            max_title_length=p.get("max_title_length"),
            max_body_length=p.get("max_body_length"),
            formatting_rules=p.get("formatting_rules", {}),
            schedule_notes=p.get("schedule_notes"),
        )
        for p in result.data
    ]
    return PlatformListResponse(platforms=platforms)


@router.get("/platforms/{platform}/rules", response_model=PlatformRuleResponse)
async def get_platform_rules(
    platform: str,
    sub_target: str = Query(None, description="Subreddit or sub-platform target"),
):
    """Get rules for a specific platform/sub-target."""
    sb = get_supabase_client()
    query = sb.table("platform_rules").select("*").eq("platform", platform).eq("is_active", True)

    if sub_target:
        query = query.eq("sub_target", sub_target)
    else:
        query = query.is_("sub_target", "null")

    result = query.single().execute()

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail=f"No rules found for {platform}" + (f"/{sub_target}" if sub_target else ""),
        )

    p = result.data
    return PlatformRuleResponse(
        id=p["id"],
        platform=p["platform"],
        sub_target=p.get("sub_target"),
        display_name=p["display_name"],
        prefix=p.get("prefix"),
        forbidden_words=p.get("forbidden_words", []),
        required_elements=p.get("required_elements", []),
        max_title_length=p.get("max_title_length"),
        max_body_length=p.get("max_body_length"),
        formatting_rules=p.get("formatting_rules", {}),
        schedule_notes=p.get("schedule_notes"),
    )


@router.post("/platforms/validate")
async def validate_post(
    platform: str = Query(...),
    sub_target: str = Query(None),
    title: str = Query(""),
    body: str = Query(""),
):
    """Validate a post against platform rules and return rule checks."""
    sb = get_supabase_client()
    query = sb.table("platform_rules").select("*").eq("platform", platform).eq("is_active", True)

    if sub_target:
        query = query.eq("sub_target", sub_target)
    else:
        query = query.is_("sub_target", "null")

    result = query.single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Platform rules not found")

    checks = validate_post_against_rules(result.data, title, body)
    passed = sum(1 for c in checks if c["status"] == "pass")

    return {
        "platform": platform,
        "sub_target": sub_target,
        "checks": checks,
        "passed": passed,
        "total": len(checks),
        "all_passed": passed == len(checks),
    }
