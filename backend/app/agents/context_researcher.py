"""OmniLaunch — Context Research Agent.

Fetches platform rules and merges them with dynamic context
(day-of-week constraints, tone guidance) to produce a complete
set of constraints for the Drafting Agent.
"""

from app.db.supabase_client import get_supabase_client
from app.services.platform_service import get_day_based_warnings


async def research_platform_context(platform: str, sub_target: str | None = None) -> dict:
    """
    Fetch and enrich platform constraints for a given target.

    Returns a constraints dict ready for the Drafting Agent.
    """
    sb = get_supabase_client()
    query = sb.table("platform_rules").select("*").eq("platform", platform).eq("is_active", True)

    if sub_target:
        query = query.eq("sub_target", sub_target)
    else:
        query = query.is_("sub_target", "null")

    result = query.maybe_single().execute()

    if not result or not result.data:
        # Fallback: return minimal constraints
        return {
            "platform": platform,
            "sub_target": sub_target,
            "constraints": {
                "prefix": None,
                "max_title_length": 300,
                "max_body_length": None,
                "forbidden_words": [],
                "required_elements": [],
                "formatting": {"markdown": True},
                "tone_guidance": "Be authentic and helpful.",
            },
        }

    rules = result.data
    fmt = rules.get("formatting_rules", {})

    # Get day-based warnings
    day_warnings = get_day_based_warnings(rules)

    constraints = {
        "platform": platform,
        "sub_target": sub_target,
        "display_name": rules.get("display_name", platform),
        "constraints": {
            "prefix": rules.get("prefix"),
            "max_title_length": rules.get("max_title_length"),
            "max_body_length": rules.get("max_body_length"),
            "forbidden_words": rules.get("forbidden_words", []),
            "required_elements": rules.get("required_elements", []),
            "formatting": fmt,
            "tone_guidance": fmt.get("tone", ""),
            "schedule_notes": rules.get("schedule_notes", ""),
        },
        "day_warnings": day_warnings,
    }

    return constraints
