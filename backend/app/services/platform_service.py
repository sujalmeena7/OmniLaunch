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

    # ── Platform-specific validations ─────────────────────────
    platform = rules.get("platform", "")
    sub_target = rules.get("sub_target", "") or ""

    # LinkedIn-specific validations
    if platform == "linkedin":
        # Body length warning
        if body and len(body) > 3000:
            checks.append({
                "rule": "body_length",
                "status": "warning",
                "detail": f"Body is {len(body)} characters — LinkedIn truncates posts over 3000 chars",
            })

        # Hook line check — first line should be short and punchy
        if body:
            first_line = body.split("\n")[0].strip()
            word_count = len(first_line.split())
            if word_count > 12:
                checks.append({
                    "rule": "hook_line",
                    "status": "warning",
                    "detail": f"First line is {word_count} words — LinkedIn hooks work best under 12 words",
                })
            else:
                checks.append({
                    "rule": "hook_line",
                    "status": "pass",
                    "detail": f"Hook line is {word_count} words — punchy and effective",
                })

        # Hashtag count
        if body:
            hashtags = re.findall(r"#\w+", body)
            if len(hashtags) > 5:
                checks.append({
                    "rule": "hashtags",
                    "status": "warning",
                    "detail": f"Found {len(hashtags)} hashtags — LinkedIn recommends 3-5 max",
                })
            elif hashtags:
                checks.append({
                    "rule": "hashtags",
                    "status": "pass",
                    "detail": f"{len(hashtags)} hashtags used",
                })

        # Link in body detection
        if body:
            url_pattern = re.compile(r"https?://[^\s]+")
            if url_pattern.search(body):
                checks.append({
                    "rule": "link_in_body",
                    "status": "warning",
                    "detail": "LinkedIn suppresses posts with links — put your link in the first comment instead",
                })
            else:
                checks.append({
                    "rule": "link_in_body",
                    "status": "pass",
                    "detail": "No links in body — good for LinkedIn reach",
                })

    # Dev.to-specific validations
    if platform == "devto":
        # Title length
        if title and len(title) > 100:
            checks.append({
                "rule": "title_length",
                "status": "fail",
                "detail": f"Title is {len(title)} characters — Dev.to limit is 100",
            })

        # Code block detection
        if body:
            has_code_block = "```" in body or "    " in body
            if not has_code_block:
                checks.append({
                    "rule": "code_block",
                    "status": "warning",
                    "detail": "Dev.to posts perform better with at least one code snippet",
                })
            else:
                checks.append({
                    "rule": "code_block",
                    "status": "pass",
                    "detail": "Code block detected",
                })

        # Tags check (via required_elements)
        required_elems = rules.get("required_elements", [])
        if "tags" in required_elems:
            checks.append({
                "rule": "tags",
                "status": "warning",
                "detail": "Remember to add tags when publishing (showdev, buildinpublic recommended)",
            })

        # Markdown headers
        if body:
            has_headers = "## " in body or "# " in body
            if not has_headers:
                checks.append({
                    "rule": "markdown_headers",
                    "status": "info",
                    "detail": "Consider adding section headers for readability",
                })
            else:
                checks.append({
                    "rule": "markdown_headers",
                    "status": "pass",
                    "detail": "Markdown headers detected — good structure",
                })

    # r/sideprojects-specific validations
    if platform == "reddit" and sub_target == "r/sideprojects":
        # Title length
        if title and len(title) > 300:
            checks.append({
                "rule": "title_length",
                "status": "fail",
                "detail": f"Title is {len(title)} characters — Reddit limit is 300",
            })

        # Link in body
        if body:
            url_pattern = re.compile(r"https?://[^\s]+")
            if url_pattern.search(body):
                checks.append({
                    "rule": "link_in_body",
                    "status": "warning",
                    "detail": "r/sideprojects automod removes posts with links in body — put your link in comments",
                })
            else:
                checks.append({
                    "rule": "link_in_body",
                    "status": "pass",
                    "detail": "No links in body — safe from automod",
                })

        # Bullet points detection
        if body:
            has_bullets = bool(re.search(r"^[\s]*[-•*]\s", body, re.MULTILINE))
            if has_bullets:
                checks.append({
                    "rule": "bullet_points",
                    "status": "warning",
                    "detail": "Casual prose performs better than bullet points on r/sideprojects",
                })
            else:
                checks.append({
                    "rule": "bullet_points",
                    "status": "pass",
                    "detail": "Conversational style — good fit for r/sideprojects",
                })

        # Word count
        if body:
            word_count = len(body.split())
            if word_count > 200:
                checks.append({
                    "rule": "word_count",
                    "status": "warning",
                    "detail": f"Body is {word_count} words — keep it under 200 words for r/sideprojects",
                })
            else:
                checks.append({
                    "rule": "word_count",
                    "status": "pass",
                    "detail": f"{word_count} words — concise and on target",
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
