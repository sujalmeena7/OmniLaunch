"""OmniLaunch — Voice Analysis Service.

Analyzes user writing samples to create a Tone Manifesto that captures
their unique writing style, sentence structure, and personality.
"""

import json
import logging
import re
from app.config import get_settings

logger = logging.getLogger("omnilaunch.voice_service")


# Pre-built AI-ism patterns to detect in user samples
AI_ISM_PATTERNS = [
    "in today's fast-paced world",
    "unlock your potential",
    "dive into",
    "leverage",
    "utilize",
    "streamline",
    "revolutionize",
    "game-changer",
    "cutting-edge",
    "state-of-the-art",
    "empower",
    "seamlessly",
    "robust",
    "holistic",
    "synergy",
    "paradigm shift",
    "disruptive",
    "innovative solution",
    "next-generation",
    "best-in-class",
]


async def generate_style_embedding(text: str) -> list[float]:
    """Generate a 768-dim embedding using text-embedding-004.

    Calls Google's text-embedding-004 model with SEMANTIC_SIMILARITY task type
    to produce a vector representation of the writing style.
    """
    import google.generativeai as genai

    settings = get_settings()
    genai.configure(api_key=settings.gemini_api_key)
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="SEMANTIC_SIMILARITY",
    )
    embedding = result['embedding']
    logger.info("style_embedding generated: %d dims", len(embedding))
    return embedding  # 768-dim list[float]


async def analyze_voice_samples(samples: list[dict]) -> tuple[dict, float]:
    """
    Analyze writing samples and produce a Tone Manifesto.

    Returns a tuple of (tone_manifesto_dict, confidence_score).
    Uses Gemini to analyze the writing patterns.
    """
    settings = get_settings()

    # Collect all text content from samples
    texts = []
    for sample in samples:
        if sample["type"] == "text":
            texts.append(sample["value"])
        elif sample["type"] == "url":
            # TODO: In production, scrape the URL content
            texts.append(f"[Content from URL: {sample['value']}]")

    combined_text = "\n\n---\n\n".join(texts)

    # If Gemini API key is available, use it for analysis
    if settings.gemini_api_key:
        return await _analyze_with_gemini(combined_text, len(samples))

    # Fallback: heuristic analysis
    return _analyze_heuristic(combined_text, len(samples))


async def _analyze_with_gemini(text: str, sample_count: int) -> tuple[dict, float]:
    """Use Google Gemini to analyze writing style."""
    import google.generativeai as genai

    settings = get_settings()
    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(settings.gemini_model)

    prompt = f"""Analyze the following writing samples and produce a detailed voice profile.
Return ONLY valid JSON with exactly this structure (no markdown, no code fences):

{{
  "sentence_structure": "short_punchy" | "long_flowing" | "mixed",
  "avg_sentence_length": <number>,
  "vocabulary_level": "simple" | "accessible_technical" | "highly_technical" | "academic",
  "technicality_score": <0.0-1.0>,
  "emoji_usage": "none" | "minimal" | "moderate" | "heavy",
  "emoji_examples": [<list of emojis used>],
  "hashtag_usage": "none" | "minimal" | "moderate" | "heavy",
  "humor_level": "none" | "dry_wit" | "casual_humor" | "very_funny",
  "formality": <0.0=very casual, 1.0=very formal>,
  "first_person_preference": "I" | "we" | "mixed" | "none",
  "call_to_action_style": "none" | "soft_ask" | "direct" | "aggressive",
  "forbidden_patterns": [<AI-isms or phrases this person would NEVER use>],
  "signature_phrases": [<distinctive phrases or patterns unique to this writer>],
  "paragraph_length": "1 sentence" | "2-3 sentences" | "4+ sentences",
  "opening_style": "direct_hook" | "story" | "question" | "greeting",
  "closing_style": "soft_cta" | "question" | "summary" | "none"
}}

Writing samples:
{text}"""

    response = model.generate_content(prompt)
    raw = response.text.strip()

    # Strip code fences if present
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

    manifesto = json.loads(raw)
    confidence = min(0.95, 0.5 + (sample_count * 0.09))
    return manifesto, confidence


def _analyze_heuristic(text: str, sample_count: int) -> tuple[dict, float]:
    """Fallback heuristic analysis when no LLM is available."""
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]

    avg_len = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)

    # Detect emoji usage
    emoji_pattern = re.compile(
        "[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF"
        "\U0001F1E0-\U0001F1FF\U00002702-\U000027B0\U0001f900-\U0001f9FF"
        "\U0001FA00-\U0001FA6F\U0001FA70-\U0001FAFF]+",
        flags=re.UNICODE,
    )
    emojis = emoji_pattern.findall(text)

    # Detect formality
    informal_markers = ["hey", "lol", "btw", "gonna", "wanna", "y'all", "tbh", "ngl"]
    informal_count = sum(1 for w in text.lower().split() if w in informal_markers)
    formality = max(0.1, min(0.9, 0.5 - (informal_count * 0.05)))

    # Detect first person
    i_count = text.lower().split().count("i")
    we_count = text.lower().split().count("we")
    first_person = "I" if i_count > we_count else "we" if we_count > i_count else "mixed"

    manifesto = {
        "sentence_structure": "short_punchy" if avg_len < 12 else "long_flowing" if avg_len > 20 else "mixed",
        "avg_sentence_length": round(avg_len),
        "vocabulary_level": "accessible_technical",
        "technicality_score": 0.5,
        "emoji_usage": "none" if not emojis else "minimal" if len(emojis) < 3 else "moderate",
        "emoji_examples": list(set(emojis))[:5],
        "hashtag_usage": "moderate" if "#" in text else "none",
        "humor_level": "none",
        "formality": round(formality, 2),
        "first_person_preference": first_person,
        "call_to_action_style": "soft_ask",
        "forbidden_patterns": [p for p in AI_ISM_PATTERNS if p.lower() in text.lower()],
        "signature_phrases": [],
        "paragraph_length": "2-3 sentences",
        "opening_style": "direct_hook",
        "closing_style": "soft_cta",
    }

    confidence = min(0.7, 0.3 + (sample_count * 0.08))
    return manifesto, confidence
