"""OmniLaunch — Platform Rule Validation Service.

Validates generated posts against platform-specific rules and returns
a list of rule checks with pass/warning/fail statuses.
"""

import re
from datetime import datetime, timezone


def validate_post_against_rules(
    rules: dict,
    title: str,
    body: str,
) -> list[dict]:
    """
    Validate a post against a platform's rulebook.

    Returns a list of rule check dicts with { rule, status, detail }.
    """
    checks = []

    # ── Title length check ────────────────────────────────────
    max_title = rules.get("max_title_length")
    if max_title:
        title_len = len(title) if title else 0
        prefix = rules.get("prefix", "")
        effective_title = f"{prefix} {title}".strip() if prefix else title
        effective_len = len(effective_title)

        if effective_len <= max_title:
            checks.append({
                "rule": "title_length",
                "status": "pass",
                "detail": f"{effective_len}/{max_title} characters",
            })
        elif effective_len <= max_title * 1.1:
            checks.append({
                "rule": "title_length",
                "status": "warning",
                "detail": f"{effective_len}/{max_title} characters (slightly over)",
            })
        else:
            checks.append({
                "rule": "title_length",
                "status": "fail",
                "detail": f"{effective_len}/{max_title} characters (over limit)",
            })

    # ── Body length check ─────────────────────────────────────
    max_body = rules.get("max_body_length")
    if max_body:
        body_len = len(body) if body else 0
        if body_len <= max_body:
            checks.append({
                "rule": "body_length",
                "status": "pass",
                "detail": f"{body_len}/{max_body} characters",
            })
        else:
            checks.append({
                "rule": "body_length",
                "status": "fail",
                "detail": f"{body_len}/{max_body} characters (over limit)",
            })

    # ── Prefix check ──────────────────────────────────────────
    prefix = rules.get("prefix")
    if prefix and title:
        if title.startswith(prefix):
            checks.append({
                "rule": "prefix",
                "status": "pass",
                "detail": f"Title starts with '{prefix}'",
            })
        else:
            checks.append({
                "rule": "prefix",
                "status": "fail",
                "detail": f"Title must start with '{prefix}'",
            })

    # ── Forbidden words check ─────────────────────────────────
    forbidden = rules.get("forbidden_words", [])
    if forbidden:
        full_text = f"{title or ''} {body or ''}".lower()
        found = [w for w in forbidden if w.lower() in full_text]
        if not found:
            checks.append({
                "rule": "forbidden_words",
                "status": "pass",
                "detail": "No forbidden words detected",
            })
        else:
            checks.append({
                "rule": "forbidden_words",
                "status": "fail",
                "detail": f"Contains forbidden words: {', '.join(found)}",
            })

    # ── Required elements check ───────────────────────────────
    required = rules.get("required_elements", [])
    for element in required:
        if element.startswith("flair:"):
            flair_name = element.split(":", 1)[1]
            # Check schedule constraints
            schedule = rules.get("schedule_notes", "")
            if schedule:
                checks.append({
                    "rule": f"flair_{flair_name.lower()}",
                    "status": "warning",
                    "detail": f"Flair '{flair_name}' required. Note: {schedule}",
                })
            else:
                checks.append({
                    "rule": f"flair_{flair_name.lower()}",
                    "status": "pass",
                    "detail": f"Flair '{flair_name}' should be applied when posting",
                })
        elif element == "link_in_url_field":
            checks.append({
                "rule": "link_placement",
                "status": "pass",
                "detail": "Link should be placed in the URL field, not body text",
            })
        elif element == "include_tech_stack":
            full_text = f"{title or ''} {body or ''}".lower()
            tech_keywords = ["react", "next", "vue", "angular", "python", "node",
                             "fastapi", "django", "rails", "rust", "go", "typescript"]
            has_tech = any(kw in full_text for kw in tech_keywords)
            checks.append({
                "rule": "tech_stack",
                "status": "pass" if has_tech else "warning",
                "detail": "Tech stack mentioned" if has_tech else "Consider mentioning your tech stack",
            })

    # ── Formatting rules check ────────────────────────────────
    fmt = rules.get("formatting_rules", {})

    # Tagline length (Product Hunt)
    tagline_max = fmt.get("tagline_max")
    if tagline_max and title:
        if len(title) <= tagline_max:
            checks.append({
                "rule": "tagline_length",
                "status": "pass",
                "detail": f"Tagline: {len(title)}/{tagline_max} characters",
            })
        else:
            checks.append({
                "rule": "tagline_length",
                "status": "fail",
                "detail": f"Tagline: {len(title)}/{tagline_max} characters (over limit)",
            })

    return checks


def get_day_based_warnings(rules: dict) -> list[dict]:
    """Check for day-of-week scheduling constraints."""
    warnings = []
    schedule = rules.get("schedule_notes", "")
    if not schedule:
        return warnings

    now = datetime.now(timezone.utc)
    day_name = now.strftime("%A")

    # Simple day matching
    day_lower = day_name.lower()
    schedule_lower = schedule.lower()

    if day_lower not in schedule_lower and ("only" in schedule_lower or "only on" in schedule_lower):
        warnings.append({
            "rule": "schedule",
            "status": "warning",
            "detail": f"Today is {day_name}. {schedule}",
        })

    return warnings
