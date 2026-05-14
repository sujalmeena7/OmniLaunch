"""OmniLaunch — Drafting Agent.

Generates platform-specific posts using the user's Tone Manifesto
and platform constraints. Produces raw drafts that the Humanizer
will then refine.
"""

import json
import re
from app.config import get_settings


DRAFTING_SYSTEM_PROMPT = """You are a ghostwriter. You write as a specific person based on their voice profile.
You are creating a launch post for a product on a specific platform.

VOICE PROFILE (match this exactly):
{tone_manifesto}

PLATFORM: {platform} {sub_target}
PLATFORM RULES:
{constraints}

PRODUCT INFO:
- Name: {product_name}
- Description: {product_description}
- URL: {product_url}
- Target Audience: {target_audience}
- Tech Stack: {tech_stack}

CRITICAL RULES:
1. Match the user's sentence structure, vocabulary level, and formality EXACTLY
2. Use their emoji style (usage: {emoji_usage}, examples: {emoji_examples})
3. Use their opening style: {opening_style}
4. Use their closing style: {closing_style}
5. NEVER use words from the forbidden list: {forbidden_words}
6. Stay within character limits (title: {max_title_length}, body: {max_body_length})
7. Include all required elements: {required_elements}
8. If a prefix is required, start the title with: {prefix}
9. Do NOT sound like an AI. Avoid: "dive into", "leverage", "utilize", "streamline", "in today's world", "game-changer", "cutting-edge"
10. Match the platform's tone: {tone_guidance}

HARD CHARACTER LIMITS — THESE ARE NON-NEGOTIABLE:
- If the title limit is 80 characters, the FULL title (including any prefix like "Show HN: ") MUST be under 80 characters total. Count every character carefully before finalizing.
- If the body/description limit is 260 characters, the body MUST be under 260 characters. No exceptions.
- If a tagline limit of 60 characters exists, the title MUST be under 60 characters.
- ALWAYS count your output characters. If over the limit, shorten it. Do NOT exceed limits.

Return ONLY valid JSON (no markdown, no code fences):
{{
  "title": "<post title>",
  "body": "<post body text>"
}}"""


async def draft_post(
    tone_manifesto: dict,
    platform_constraints: dict,
    product: dict,
) -> dict:
    """
    Generate a raw draft for a single platform.

    Returns {"title": str, "body": str}.
    """
    settings = get_settings()
    constraints = platform_constraints.get("constraints", {})

    prompt = DRAFTING_SYSTEM_PROMPT.format(
        tone_manifesto=json.dumps(tone_manifesto, indent=2),
        platform=platform_constraints.get("platform", ""),
        sub_target=platform_constraints.get("sub_target", "") or "",
        constraints=json.dumps(constraints, indent=2),
        product_name=product.get("name", ""),
        product_description=product.get("description", ""),
        product_url=product.get("url", ""),
        target_audience=product.get("target_audience", ""),
        tech_stack=", ".join(product.get("tech_stack", [])),
        emoji_usage=tone_manifesto.get("emoji_usage", "none"),
        emoji_examples=", ".join(tone_manifesto.get("emoji_examples", [])),
        opening_style=tone_manifesto.get("opening_style", "direct_hook"),
        closing_style=tone_manifesto.get("closing_style", "soft_cta"),
        forbidden_words=", ".join(constraints.get("forbidden_words", [])),
        max_title_length=constraints.get("max_title_length") or "no limit",
        max_body_length=constraints.get("max_body_length") or "no limit",
        required_elements=", ".join(constraints.get("required_elements", [])),
        prefix=constraints.get("prefix") or "none",
        tone_guidance=constraints.get("tone_guidance", ""),
    )

    if settings.gemini_api_key:
        draft = await _draft_with_gemini(prompt)
    else:
        # Fallback: generate a template-based draft
        draft = _draft_fallback(product, platform_constraints, tone_manifesto)

    # Post-generation safety: enforce hard character limits
    max_title = constraints.get("max_title_length")
    max_body = constraints.get("max_body_length")
    fmt = constraints.get("formatting", {}) if isinstance(constraints.get("formatting"), dict) else {}
    tagline_max = fmt.get("tagline_max")

    if max_title and draft.get("title") and len(draft["title"]) > max_title:
        draft["title"] = draft["title"][:max_title - 3].rsplit(" ", 1)[0] + "..."

    if tagline_max and draft.get("title") and len(draft["title"]) > tagline_max:
        draft["title"] = draft["title"][:tagline_max - 3].rsplit(" ", 1)[0] + "..."

    if max_body and draft.get("body") and len(draft["body"]) > max_body:
        draft["body"] = draft["body"][:max_body - 3].rsplit(" ", 1)[0] + "..."

    return draft


async def _draft_with_gemini(prompt: str) -> dict:
    """Use Gemini to generate the draft."""
    import google.generativeai as genai

    settings = get_settings()
    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(settings.gemini_model)

    response = model.generate_content(prompt)
    raw = response.text.strip()

    # Strip code fences if present
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

    try:
        result = json.loads(raw)
        return {
            "title": result.get("title", ""),
            "body": result.get("body", ""),
        }
    except json.JSONDecodeError:
        # If JSON parsing fails, try to extract title and body
        lines = raw.strip().split("\n", 1)
        return {
            "title": lines[0][:200] if lines else "",
            "body": lines[1] if len(lines) > 1 else raw,
        }


def _draft_fallback(product: dict, platform_constraints: dict, tone_manifesto: dict) -> dict:
    """Template-based fallback when no LLM is available."""
    platform = platform_constraints.get("platform", "")
    sub_target = platform_constraints.get("sub_target", "")
    constraints = platform_constraints.get("constraints", {})
    prefix = constraints.get("prefix", "")

    name = product.get("name", "My Product")
    desc = product.get("description", "")
    tech = ", ".join(product.get("tech_stack", []))

    # Generate title
    if prefix:
        title = f"{prefix} {name} — {desc[:60]}"
    elif sub_target:
        title = f"I built {name} — {desc[:80]}"
    else:
        title = f"{name} — {desc[:60]}"

    # Truncate title if needed
    max_title = constraints.get("max_title_length")
    if max_title and len(title) > max_title:
        title = title[: max_title - 3] + "..."

    # Generate body based on platform
    if platform == "hackernews":
        body = None  # HN posts are link-only
    elif platform == "producthunt":
        body = desc[:260] if constraints.get("max_body_length") else desc[:260]
    else:
        greeting = "Hey" + (f" {sub_target} 👋" if sub_target else " 👋")
        body = f"""{greeting}

I built {name} because {desc[:200]}

{f"Tech stack: {tech}" if tech else ""}

Would love to hear your feedback!"""

    # Truncate body if needed
    max_body = constraints.get("max_body_length")
    if max_body and body and len(body) > max_body:
        body = body[: max_body - 3] + "..."

    return {"title": title, "body": body}
