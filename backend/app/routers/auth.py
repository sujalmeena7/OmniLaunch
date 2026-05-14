"""OmniLaunch — Auth Router."""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import get_settings
from app.db.supabase_client import get_supabase_client, get_supabase_public_client
from app.models.schemas import (
    SignupRequest, LoginRequest, AuthResponse, UserProfile
)

router = APIRouter()
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Validate JWT and return user data from Supabase."""
    try:
        sb = get_supabase_public_client()
        user_response = sb.auth.get_user(credentials.credentials)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return {"id": user_response.user.id, "email": user_response.user.email}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignupRequest):
    """Register a new user and create their profile."""
    try:
        sb = get_supabase_public_client()
        auth_response = sb.auth.sign_up({
            "email": req.email,
            "password": req.password,
        })

        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Signup failed")

        # Create profile with service role client (bypasses RLS)
        admin_sb = get_supabase_client()
        admin_sb.table("profiles").insert({
            "id": auth_response.user.id,
            "email": req.email,
            "display_name": req.display_name or req.email.split("@")[0],
            "plan": "free",
            "launches_remaining": 3,
        }).execute()

        # Create default free subscription
        admin_sb.table("subscriptions").insert({
            "user_id": auth_response.user.id,
            "plan": "free",
            "status": "active",
            "launches_per_month": 3,
        }).execute()

        return AuthResponse(
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            user={
                "id": auth_response.user.id,
                "email": req.email,
                "display_name": req.display_name,
                "plan": "free",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Authenticate a user and return tokens."""
    try:
        sb = get_supabase_public_client()
        auth_response = sb.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password,
        })

        if not auth_response.user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Fetch profile
        admin_sb = get_supabase_client()
        profile = admin_sb.table("profiles").select("*").eq(
            "id", auth_response.user.id
        ).single().execute()

        return AuthResponse(
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            user=profile.data,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/refresh")
async def refresh_token(request: Request):
    """Refresh the access token."""
    body = await request.json()
    refresh = body.get("refresh_token")
    if not refresh:
        raise HTTPException(status_code=400, detail="refresh_token required")
    try:
        sb = get_supabase_public_client()
        response = sb.auth.refresh_session(refresh)
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me", response_model=UserProfile)
async def get_me(user: dict = Depends(get_current_user)):
    """Get the current user's profile."""
    sb = get_supabase_client()
    result = sb.table("profiles").select("*").eq("id", user["id"]).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return UserProfile(**result.data)
