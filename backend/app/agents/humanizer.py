"""OmniLaunch — Humanizer / Critique Agent.

Reviews drafts for AI-isms, validates against platform rules,
scores voice match, and either approves or sends back for revision.
"""

import json
import logging
import re

import numpy as np

from app.config import get_settings
from app.services.platform_service import validate_post_against_rules
from app.services.voice_service import generate_style_embedding

logger = logging.getLogger("omnilaunch.humanizer")


def compute_cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    a = np.array(vec_a)
    b = np.array(vec_b)
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))


# Extended AI-ism patterns (50+)
AI_ISM_PATTERNS = [
    ("in today's fast-paced world", "these days"),
    ("unlock your potential", "get better at"),
    ("dive into", "look at"),
    ("dive deep", "dig into"),
    ("leverage", "use"),
    ("utilize", "use"),
    ("streamline", "speed up"),
    ("revolutionize", "change"),
    ("game-changer", "useful"),
    ("cutting-edge", "modern"),
    ("state-of-the-art", "current"),
    ("empower", "help"),
    ("seamlessly", "smoothly"),
    ("robust", "solid"),
    ("holistic", "complete"),
    ("synergy", "working together"),
    ("paradigm shift", "big change"),
    ("disruptive", "different"),
    ("innovative solution", "new approach"),
    ("next-generation", "new"),
    ("best-in-class", "good"),
    ("at the end of the day", "ultimately"),
    ("it goes without saying", "obviously"),
    ("needless to say", "clearly"),
    ("in order to", "to"),
    ("due to the fact that", "because"),
    ("at this point in time", "now"),
    ("for all intents and purposes", "basically"),
    ("take it to the next level", "improve"),
    ("think outside the box", "be creative"),
    ("move the needle", "make progress"),
    ("low-hanging fruit", "easy wins"),
    ("circle back", "revisit"),
    ("touch base", "check in"),
    ("deep dive", "detailed look"),
    ("pain point", "problem"),
    ("value proposition", "what it offers"),
    ("mission-critical", "important"),
    ("scalable solution", "solution that grows"),
    ("ecosystem", "system"),
    ("end-to-end", "complete"),
    ("actionable insights", "useful info"),
    ("data-driven", "based on data"),
    ("best practices", "good approaches"),
    ("core competency", "strength"),
    ("deliverables", "results"),
    ("bandwidth", "time"),
    ("pivot", "change direction"),
    ("iterate", "improve"),
    ("onboard", "get started"),
]


def detect_and_replace_ai_isms(text: str) -> tuple[str, list[str]]:
    """
    Scan text for AI-isms and replace them with natural alternatives.

    Returns (cleaned_text, list_of_replacements_made).
    """
    replacements = []
    cleaned = text

    for ai_phrase, replacement in AI_ISM_PATTERNS:
        pattern = re.compile(re.escape(ai_phrase), re.IGNORECASE)
        if pattern.search(cleaned):
            cleaned = pattern.sub(replacement, cleaned)
            replacements.append(f"{ai_phrase} → {replacement}")

    return cleaned, replacements


def score_voice_match(draft: str, tone_manifesto: dict) -> float:
    """
    Score how well a draft matches the user's voice profile.

    Returns a float between 0.0 and 1.0.
    This is a heuristic scorer — in production, use embedding similarity.
    """
    score = 0.7  # Base score

    if not draft:
        return 0.5

    sentences = re.split(r"[.!?]+", draft)
    sentences = [s.strip() for s in sentences if s.strip()]

    if not sentences:
        return 0.5

    # Check sentence length match
    avg_len = sum(len(s.split()) for s in sentences) / len(sentences)
    target_len = tone_manifesto.get("avg_sentence_length", 15)
    len_diff = abs(avg_len - target_len) / max(target_len, 1)
    if len_diff < 0.2:
        score += 0.1
    elif len_diff > 0.5:
        score -= 0.1

    # Check formality match
    informal_markers = ["hey", "lol", "btw", "gonna", "wanna", "tbh", "ngl", "👋", "🚀"]
    informal_count = sum(1 for w in draft.lower().split() if w in informal_markers)
    target_formality = tone_manifesto.get("formality", 0.5)

    if target_formality < 0.4 and informal_count > 0:
        score += 0.05  # Casual voice with casual markers = good
    elif target_formality > 0.7 and informal_count == 0:
        score += 0.05  # Formal voice without informal markers = good

    # Check emoji usage
    emoji_usage = tone_manifesto.get("emoji_usage", "none")
    has_emoji = bool(re.search(r"[\U0001F600-\U0001FAFF]", draft))
    if emoji_usage == "none" and not has_emoji:
        score += 0.05
    elif emoji_usage in ("minimal", "moderate", "heavy") and has_emoji:
        score += 0.05
    elif emoji_usage == "none" and has_emoji:
        score -= 0.05

    # Check for forbidden patterns from the user's profile
    forbidden = tone_manifesto.get("forbidden_patterns", [])
    for pattern in forbidden:
        if pattern.lower() in draft.lower():
            score -= 0.05

    # Check first person preference
    pref = tone_manifesto.get("first_person_preference", "I")
    i_count = draft.lower().split().count("i")
    we_count = draft.lower().split().count("we")
    if pref == "I" and i_count > we_count:
        score += 0.05
    elif pref == "we" and we_count > i_count:
        score += 0.05

    return max(0.0, min(1.0, score))


def normalize_cosine_to_score(cosine_sim: float) -> float:
    """Normalize cosine similarity from [-1, 1] to [0, 1]."""
    return (cosine_sim + 1.0) / 2.0


HUMANIZER_PROMPT = """You are a writing critic and editor. Your job is to make this draft sound MORE like the original author and LESS like AI.

ORIGINAL AUTHOR'S VOICE PROFILE:
{tone_manifesto}

PLATFORM RULES:
{constraints}

CURRENT DRAFT:
Title: {title}
Body: {body}

ISSUES FOUND:
- AI-isms detected and replaced: {ai_isms}
- Voice match score: {voice_score}% (target: 85%+)
- Rule violations: {rule_violations}

INSTRUCTIONS:
1. Rewrite the draft to better match the author's voice
2. Fix any rule violations
3. Keep the same core message and information
4. Match sentence structure: {sentence_structure}
5. Match formality level: {formality}
6. Use their opening style: {opening_style}
7. Use their closing style: {closing_style}

Return ONLY valid JSON (no markdown, no code fences):
{{
  "title": "<revised title>",
  "body": "<revised body>"
}}"""


async def _score_voice_match_with_embedding(
    draft_text: str, style_embedding: list[float]
) -> float:
    """Score voice match using embedding cosine similarity.

    Generates an embedding for the draft text, computes cosine similarity
    with the stored style_embedding, and normalizes to [0, 1].
    """
    draft_embedding = await generate_style_embedding(draft_text)
    cosine_sim = compute_cosine_similarity(draft_embedding, style_embedding)
    return normalize_cosine_to_score(cosine_sim)


async def humanize_post(
    draft: dict,
    tone_manifesto: dict,
    platform_constraints: dict,
    platform_rules_raw: dict | None = None,
    style_embedding: list[float] | None = None,
) -> dict:
    """
    Review and humanize a draft post.

    Returns a dict with:
    - title, body (possibly revised)
    - voice_match_score
    - rule_checks
    - ai_isms_removed
    - revision (incremented)
    - approved (bool — True if score >= 0.85)
    """
    title = draft.get("title", "")
    body = draft.get("body", "") or ""

    # Step 1: Detect and replace AI-isms
    cleaned_title, title_replacements = detect_and_replace_ai_isms(title)
    cleaned_body, body_replacements = detect_and_replace_ai_isms(body)
    all_replacements = title_replacements + body_replacements

    # Step 2: Score voice match
    full_text = f"{cleaned_title} {cleaned_body}"

    if style_embedding is not None:
        # Embedding-based scoring: generate draft embedding and compare
        try:
            voice_score = await _score_voice_match_with_embedding(
                full_text, style_embedding
            )
            logger.info("Using embedding scoring (score=%.3f)", voice_score)
        except Exception as e:
            # If embedding generation fails, fall back to heuristic
            logger.warning(
                "Embedding scoring failed, falling back to heuristic: %s", e
            )
            voice_score = score_voice_match(full_text, tone_manifesto)
    else:
        # Legacy profiles without style_embedding: use heuristic scorer
        logger.info("Using heuristic scoring (no style_embedding on profile)")
        voice_score = score_voice_match(full_text, tone_manifesto)

    # Step 3: Validate against platform rules
    rule_checks = []
    if platform_rules_raw:
        rule_checks = validate_post_against_rules(platform_rules_raw, cleaned_title, cleaned_body)

    # Step 4: If score is below threshold, try to improve with LLM
    settings = get_settings()
    if voice_score < 0.85 and settings.gemini_api_key:
        revised = await _revise_with_gemini(
            cleaned_title, cleaned_body, tone_manifesto,
            platform_constraints, all_replacements, voice_score, rule_checks
        )
        if revised:
            cleaned_title = revised.get("title", cleaned_title)
            cleaned_body = revised.get("body", cleaned_body)
            # Re-score after revision
            full_text = f"{cleaned_title} {cleaned_body}"
            if style_embedding is not None:
                try:
                    voice_score = await _score_voice_match_with_embedding(
                        full_text, style_embedding
                    )
                except Exception as e:
                    logger.warning(
                        "Embedding re-scoring failed, falling back to heuristic: %s", e
                    )
                    voice_score = score_voice_match(full_text, tone_manifesto)
            else:
                voice_score = score_voice_match(full_text, tone_manifesto)
            # Re-validate
            if platform_rules_raw:
                rule_checks = validate_post_against_rules(platform_rules_raw, cleaned_title, cleaned_body)

    passed = sum(1 for c in rule_checks if c["status"] == "pass")

    return {
        "title": cleaned_title,
        "body": cleaned_body if cleaned_body else None,
        "voice_match_score": round(voice_score, 2),
        "rule_checks": rule_checks,
        "rule_pass_count": passed,
        "rule_total_count": len(rule_checks),
        "ai_isms_removed": all_replacements,
        "approved": voice_score >= 0.85,
    }


async def _revise_with_gemini(
    title: str, body: str, tone_manifesto: dict,
    platform_constraints: dict, ai_isms: list, voice_score: float,
    rule_checks: list,
) -> dict | None:
    """Use Gemini to revise the draft for better voice match."""
    import google.generativeai as genai

    settings = get_settings()
    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(settings.gemini_model)

    constraints = platform_constraints.get("constraints", {})
    violations = [c for c in rule_checks if c["status"] == "fail"]

    prompt = HUMANIZER_PROMPT.format(
        tone_manifesto=json.dumps(tone_manifesto, indent=2),
        constraints=json.dumps(constraints, indent=2),
        title=title,
        body=body,
        ai_isms=", ".join(ai_isms) if ai_isms else "none",
        voice_score=int(voice_score * 100),
        rule_violations=json.dumps(violations) if violations else "none",
        sentence_structure=tone_manifesto.get("sentence_structure", "mixed"),
        formality=tone_manifesto.get("formality", 0.5),
        opening_style=tone_manifesto.get("opening_style", "direct_hook"),
        closing_style=tone_manifesto.get("closing_style", "soft_cta"),
    )

    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()

        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)

        return json.loads(raw)
    except Exception:
        return None
