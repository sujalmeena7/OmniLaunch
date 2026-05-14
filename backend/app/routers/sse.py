"""OmniLaunch — Server-Sent Events (SSE) for bundle generation progress.

Streams real-time progress updates to the frontend during bundle generation.
Uses Redis pub/sub to receive events from the Celery worker.
"""

import asyncio
import json
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

from app.routers.auth import get_current_user
from app.db.supabase_client import get_supabase_client
from app.config import get_settings

router = APIRouter()


async def _event_generator(bundle_id: str, user_id: str):
    """
    Async generator that yields SSE events for a bundle's generation progress.

    Subscribes to Redis pub/sub channel and streams events until completion.
    Falls back to polling if Redis is unavailable.
    """
    settings = get_settings()

    # Try Redis pub/sub first
    try:
        import redis.asyncio as aioredis

        r = aioredis.from_url(settings.redis_url)
        pubsub = r.pubsub()
        await pubsub.subscribe(f"bundle:{bundle_id}:progress")

        # Send initial connection event
        yield f"data: {json.dumps({'platform': 'all', 'status': 'connected', 'detail': 'Listening for progress'})}\n\n"

        timeout_seconds = 150  # 2.5 minutes max
        elapsed = 0
        interval = 0.5

        while elapsed < timeout_seconds:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=interval)

            if message and message["type"] == "message":
                data = message["data"]
                if isinstance(data, bytes):
                    data = data.decode("utf-8")

                yield f"data: {data}\n\n"

                # Check if generation is complete
                try:
                    event = json.loads(data)
                    if event.get("status") in ("complete", "failed"):
                        break
                except json.JSONDecodeError:
                    pass

            elapsed += interval

        await pubsub.unsubscribe(f"bundle:{bundle_id}:progress")
        await r.aclose()

    except Exception:
        # Fallback: poll the database for status changes
        yield f"data: {json.dumps({'platform': 'all', 'status': 'connected', 'detail': 'Polling mode (Redis unavailable)'})}\n\n"

        sb = get_supabase_client()
        last_status = "pending"
        timeout_seconds = 150
        elapsed = 0

        while elapsed < timeout_seconds:
            await asyncio.sleep(2)
            elapsed += 2

            bundle = sb.table("launch_bundles").select("status").eq("id", bundle_id).single().execute()

            if not bundle.data:
                yield f"data: {json.dumps({'platform': 'all', 'status': 'failed', 'detail': 'Bundle not found'})}\n\n"
                break

            current_status = bundle.data["status"]

            if current_status != last_status:
                yield f"data: {json.dumps({'platform': 'all', 'status': current_status, 'detail': f'Status changed to {current_status}'})}\n\n"
                last_status = current_status

                if current_status in ("complete", "failed"):
                    break

    # Final event
    yield f"data: {json.dumps({'platform': 'all', 'status': 'stream_end', 'detail': 'Connection closing'})}\n\n"


@router.get("/bundles/{bundle_id}/status")
async def bundle_status_stream(bundle_id: str, user: dict = Depends(get_current_user)):
    """
    SSE endpoint for real-time bundle generation progress.

    Events are JSON objects with: {platform, status, detail}
    Status values: connected, researching, drafting, humanizing, complete, failed, stream_end
    """
    # Verify bundle belongs to user
    sb = get_supabase_client()
    bundle = sb.table("launch_bundles").select("user_id, status").eq("id", bundle_id).single().execute()

    if not bundle.data:
        raise HTTPException(status_code=404, detail="Bundle not found")

    if bundle.data["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # If already complete, return immediately
    if bundle.data["status"] in ("complete", "failed"):
        async def completed_stream():
            yield f"data: {json.dumps({'platform': 'all', 'status': bundle.data['status'], 'detail': 'Already finished'})}\n\n"
        return StreamingResponse(completed_stream(), media_type="text/event-stream")

    return StreamingResponse(
        _event_generator(bundle_id, user["id"]),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
