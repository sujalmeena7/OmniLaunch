"""OmniLaunch — Voice Profile Router."""

from fastapi import APIRouter, HTTPException, Depends, Request

from app.routers.auth import get_current_user
from app.db.supabase_client import get_supabase_client
from app.rate_limit import limiter
from app.services.voice_service import analyze_voice_samples, generate_style_embedding
from app.models.schemas import (
    TrainVoiceRequest, UpdateVoiceProfileRequest,
    VoiceProfileResponse, VoiceProfileListResponse
)

router = APIRouter()


@router.post("/train-voice", response_model=VoiceProfileResponse)
@limiter.limit("10/minute")
async def train_voice(request: Request, req: TrainVoiceRequest, user: dict = Depends(get_current_user)):
    """Analyze writing samples and create a voice profile with a Tone Manifesto."""
    try:
        # Run voice analysis
        tone_manifesto, confidence = await analyze_voice_samples(
            [s.model_dump() for s in req.samples]
        )

        # Store in Supabase
        sb = get_supabase_client()
        result = sb.table("voice_profiles").insert({
            "user_id": user["id"],
            "name": req.name,
            "tone_manifesto": tone_manifesto,
            "source_samples": [s.model_dump() for s in req.samples],
            "sample_count": len(req.samples),
            "confidence": confidence,
            "is_active": True,
        }).execute()

        profile = result.data[0]
        return VoiceProfileResponse(
            id=profile["id"],
            name=profile["name"],
            tone_manifesto=profile["tone_manifesto"],
            sample_count=profile["sample_count"],
            confidence=profile["confidence"],
            is_active=profile["is_active"],
            created_at=profile["created_at"],
            updated_at=profile["updated_at"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice training failed: {str(e)}")


@router.get("/voice-profiles", response_model=VoiceProfileListResponse)
async def list_voice_profiles(user: dict = Depends(get_current_user)):
    """List all voice profiles for the current user."""
    sb = get_supabase_client()
    result = sb.table("voice_profiles").select("*").eq(
        "user_id", user["id"]
    ).order("created_at", desc=True).execute()

    profiles = [
        VoiceProfileResponse(
            id=p["id"],
            name=p["name"],
            tone_manifesto=p["tone_manifesto"],
            sample_count=p["sample_count"],
            confidence=p["confidence"],
            is_active=p["is_active"],
            created_at=p["created_at"],
            updated_at=p["updated_at"],
        )
        for p in result.data
    ]
    return VoiceProfileListResponse(profiles=profiles)


@router.get("/voice-profiles/{profile_id}", response_model=VoiceProfileResponse)
async def get_voice_profile(profile_id: str, user: dict = Depends(get_current_user)):
    """Get a specific voice profile."""
    sb = get_supabase_client()
    result = sb.table("voice_profiles").select("*").eq(
        "id", profile_id
    ).eq("user_id", user["id"]).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Voice profile not found")

    p = result.data
    return VoiceProfileResponse(
        id=p["id"],
        name=p["name"],
        tone_manifesto=p["tone_manifesto"],
        sample_count=p["sample_count"],
        confidence=p["confidence"],
        is_active=p["is_active"],
        created_at=p["created_at"],
        updated_at=p["updated_at"],
    )


@router.put("/voice-profiles/{profile_id}", response_model=VoiceProfileResponse)
async def update_voice_profile(
    profile_id: str,
    req: UpdateVoiceProfileRequest,
    user: dict = Depends(get_current_user),
) -> VoiceProfileResponse:
    """Update a voice profile with new samples and/or name."""
    sb = get_supabase_client()

    # Step 1: Verify profile exists
    result = sb.table("voice_profiles").select("*").eq("id", profile_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Voice profile not found")

    profile = result.data[0]

    # Step 2: Verify profile belongs to authenticated user
    if profile["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Step 3: Re-analyze voice samples to produce updated Tone Manifesto
    samples_dicts = [s.model_dump() for s in req.samples]
    tone_manifesto, confidence = await analyze_voice_samples(samples_dicts)

    # Step 4: Generate style embedding from combined sample text
    combined_text = " ".join(s.value for s in req.samples)
    try:
        style_embedding = await generate_style_embedding(combined_text)
    except Exception:
        # If embedding generation fails, store None (graceful degradation)
        style_embedding = None

    # Step 5: Update DB record with new manifesto, samples, embedding, confidence
    update_data = {
        "tone_manifesto": tone_manifesto,
        "source_samples": samples_dicts,
        "sample_count": len(req.samples),
        "confidence": confidence,
        "style_embedding": style_embedding,
    }
    if req.name is not None:
        update_data["name"] = req.name

    updated_result = sb.table("voice_profiles").update(update_data).eq("id", profile_id).execute()
    updated_profile = updated_result.data[0]

    # Step 6: Return updated profile response
    return VoiceProfileResponse(
        id=updated_profile["id"],
        name=updated_profile["name"],
        tone_manifesto=updated_profile["tone_manifesto"],
        sample_count=updated_profile["sample_count"],
        confidence=updated_profile["confidence"],
        is_active=updated_profile["is_active"],
        created_at=updated_profile["created_at"],
        updated_at=updated_profile["updated_at"],
    )


@router.delete("/voice-profiles/{profile_id}")
async def delete_voice_profile(profile_id: str, user: dict = Depends(get_current_user)):
    """Delete a voice profile."""
    sb = get_supabase_client()
    sb.table("voice_profiles").delete().eq(
        "id", profile_id
    ).eq("user_id", user["id"]).execute()
    return {"status": "deleted", "id": profile_id}
