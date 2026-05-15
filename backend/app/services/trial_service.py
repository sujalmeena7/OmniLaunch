"""OmniLaunch — Trial Service.

Manages the 14-day free trial for new users:
- assign_trial: grants 10 launches for 14 days
- check_trial_expiry: checks if a user's trial has expired
- expire_trial: resets user to Free plan (3 launches/month)
"""

from datetime import datetime, timedelta, timezone

from app.db.supabase_client import get_supabase_client


TRIAL_DURATION_DAYS = 14
TRIAL_LAUNCHES = 10
FREE_PLAN_LAUNCHES = 3


def assign_trial(user_id: str) -> None:
    """Assign a 14-day trial to a new user.

    Sets launches_remaining=10, trial_ends_at=now()+14 days, is_trial=True.
    """
    trial_ends_at = datetime.now(timezone.utc) + timedelta(days=TRIAL_DURATION_DAYS)

    sb = get_supabase_client()
    sb.table("profiles").update({
        "launches_remaining": TRIAL_LAUNCHES,
        "trial_ends_at": trial_ends_at.isoformat(),
        "is_trial": True,
    }).eq("id", user_id).execute()


def check_trial_expiry(user_id: str) -> bool:
    """Check if a user's trial has expired.

    Returns True if trial_ends_at < now() and is_trial is True.
    Returns False if the user is not on a trial or the trial is still active.
    """
    sb = get_supabase_client()
    result = sb.table("profiles").select(
        "trial_ends_at, is_trial"
    ).eq("id", user_id).single().execute()

    if not result.data:
        return False

    is_trial = result.data.get("is_trial", False)
    trial_ends_at = result.data.get("trial_ends_at")

    if not is_trial or not trial_ends_at:
        return False

    # Parse the ISO timestamp from the database
    if isinstance(trial_ends_at, str):
        trial_ends_at = datetime.fromisoformat(trial_ends_at.replace("Z", "+00:00"))

    return datetime.now(timezone.utc) > trial_ends_at


def expire_trial(user_id: str) -> None:
    """Expire a user's trial and reset to Free plan.

    Sets launches_remaining=3, launches_per_month=3, is_trial=False, plan='free'.
    """
    sb = get_supabase_client()

    # Update profile to free plan defaults
    sb.table("profiles").update({
        "launches_remaining": FREE_PLAN_LAUNCHES,
        "is_trial": False,
        "plan": "free",
    }).eq("id", user_id).execute()

    # Also update the subscription record
    sb.table("subscriptions").update({
        "launches_per_month": FREE_PLAN_LAUNCHES,
        "plan": "free",
    }).eq("user_id", user_id).execute()
