"""OmniLaunch — Agent Pipeline Orchestrator.

Coordinates the multi-agent pipeline using LangGraph StateGraph:
  Context Research → Drafting → Humanizer (with revision loop)

Each platform target is processed sequentially, with progress callbacks
for SSE streaming via Redis pub/sub.
"""

import logging
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from app.agents.context_researcher import research_platform_context
from app.agents.drafter import draft_post
from app.agents.humanizer import humanize_post

logger = logging.getLogger("omnilaunch.pipeline")
logging.basicConfig(level=logging.INFO)

MAX_REVISIONS = 3


# ---------------------------------------------------------------------------
# LangGraph Pipeline State
# ---------------------------------------------------------------------------


class PipelineState(TypedDict):
    platform: str
    sub_target: str | None
    tone_manifesto: dict
    platform_constraints: dict
    product: dict
    current_draft: dict | None
    revision_count: int
    voice_match_score: float
    progress_callback: Any  # callable or None
    style_embedding: list[float] | None
    final_post: dict | None


# ---------------------------------------------------------------------------
# Node Functions
# ---------------------------------------------------------------------------


async def context_research_node(state: PipelineState) -> dict:
    """Research platform context and store constraints in state."""
    platform_constraints = await research_platform_context(
        state["platform"], state["sub_target"]
    )

    platform_label = state["sub_target"] or state["platform"]
    progress_callback = state.get("progress_callback")
    if progress_callback:
        progress_callback(platform_label, "researching", "Fetching platform rules")

    return {"platform_constraints": platform_constraints}


async def drafting_node(state: PipelineState) -> dict:
    """Draft a post using tone manifesto and platform constraints."""
    current_draft = await draft_post(
        state["tone_manifesto"], state["platform_constraints"], state["product"]
    )

    platform_label = state["sub_target"] or state["platform"]
    progress_callback = state.get("progress_callback")
    if progress_callback:
        progress_callback(platform_label, "drafting", "Writing draft")

    return {"current_draft": current_draft}


async def humanizing_node(state: PipelineState) -> dict:
    """Humanize and score a draft, deciding whether to approve or revise."""
    result = await humanize_post(
        state["current_draft"],
        state["tone_manifesto"],
        state["platform_constraints"],
        None,
        state.get("style_embedding"),
    )

    voice_match_score = result.get("voice_match_score", 0.0)
    revision_count = state.get("revision_count", 0) + 1

    updates: dict = {
        "voice_match_score": voice_match_score,
        "revision_count": revision_count,
        "current_draft": {"title": result["title"], "body": result["body"]},
    }

    if result.get("approved") or revision_count >= 3:
        updates["final_post"] = result

    platform_label = state["sub_target"] or state["platform"]
    progress_callback = state.get("progress_callback")
    if progress_callback:
        detail = f"Reviewing draft (revision {revision_count}/{MAX_REVISIONS})"
        progress_callback(platform_label, "humanizing", detail)

    return updates


# ---------------------------------------------------------------------------
# Graph Definition
# ---------------------------------------------------------------------------

graph = StateGraph(PipelineState)
graph.add_node("context_research", context_research_node)
graph.add_node("drafting", drafting_node)
graph.add_node("humanizing", humanizing_node)

graph.set_entry_point("context_research")
graph.add_edge("context_research", "drafting")
graph.add_edge("drafting", "humanizing")


# ---------------------------------------------------------------------------
# Routing Function (revision loop logic)
# ---------------------------------------------------------------------------


def route_after_humanize(state: PipelineState) -> str:
    """Decide whether to loop back to drafting or end the pipeline.

    Routes back to drafting if the voice match score is below the threshold
    AND the revision count hasn't been exhausted. Otherwise, ends the pipeline.
    """
    if state["voice_match_score"] < 0.85 and state["revision_count"] < 3:
        return "drafting"
    return "end"


graph.add_conditional_edges("humanizing", route_after_humanize, {
    "drafting": "drafting",
    "end": END,
})


# ---------------------------------------------------------------------------
# LangGraph-Based Pipeline Runner (sequential target processing)
# ---------------------------------------------------------------------------


async def run_langgraph_pipeline(
    targets: list[dict],
    tone_manifesto: dict,
    product: dict,
    style_embedding: list[float] | None = None,
    progress_callback=None,
) -> list[dict]:
    """Run the LangGraph pipeline for each target platform sequentially.

    Compiles the StateGraph and invokes it once per target. Each invocation
    is wrapped in try/except for fault isolation — a failure in one target
    does not prevent processing of subsequent targets.

    Args:
        targets: List of {"platform": str, "sub_target": str | None}
        tone_manifesto: The user's Tone Manifesto dict
        product: Product info dict
        style_embedding: Optional 768-dim style embedding for voice matching
        progress_callback: Optional callable(platform, status, detail) for SSE events

    Returns:
        List of result dicts, one per target (final_post on success, error dict on failure)
    """
    compiled = graph.compile()
    results = []

    for target in targets:
        try:
            initial_state: PipelineState = {
                "platform": target["platform"],
                "sub_target": target.get("sub_target"),
                "tone_manifesto": tone_manifesto,
                "platform_constraints": {},
                "product": product,
                "current_draft": None,
                "revision_count": 0,
                "voice_match_score": 0.0,
                "progress_callback": progress_callback,
                "style_embedding": style_embedding,
                "final_post": None,
            }
            final_state = await compiled.ainvoke(initial_state)
            results.append(final_state.get("final_post") or {})
        except Exception as e:
            logger.error(
                f"[LangGraph] Target {target} failed: {e}", exc_info=True
            )
            platform_label = target.get("sub_target") or target["platform"]
            if progress_callback:
                progress_callback(platform_label, "failed", str(e))
            results.append({
                "platform": target["platform"],
                "sub_target": target.get("sub_target"),
                "error": str(e),
            })

    return results
