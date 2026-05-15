"""OmniLaunch — Billing Router.

Handles Razorpay subscription management, payment verification,
webhook event processing, and billing history.
"""

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.config import get_settings
from app.db.supabase_client import get_supabase_client
from app.routers.auth import get_current_user
from app.services.razorpay_service import (
    create_subscription as rz_create_subscription,
    verify_payment_signature,
    verify_webhook_signature,
    cancel_subscription as rz_cancel_subscription,
    fetch_payments,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Plan configuration ────────────────────────────────────────

PLAN_QUOTAS = {
    "free": 3,
    "pro": 50,
    "team": 999,  # effectively unlimited
}


def _resolve_plan_tier(plan_id: str) -> str | None:
    """Map a Razorpay plan ID to the internal tier name (pro or team).

    Returns None if the plan_id is not recognized.
    """
    settings = get_settings()
    pro_ids = {
        settings.razorpay_plan_id_pro_monthly,
        settings.razorpay_plan_id_pro_yearly,
    }
    team_ids = {
        settings.razorpay_plan_id_team_monthly,
        settings.razorpay_plan_id_team_yearly,
    }
    if plan_id in pro_ids:
        return "pro"
    if plan_id in team_ids:
        return "team"
    return None


# ── Request/Response Schemas ──────────────────────────────────

class CreateSubscriptionRequest(BaseModel):
    plan: str = Field(description="'pro_monthly', 'pro_yearly', 'team_monthly', or 'team_yearly'")


class CreateSubscriptionResponse(BaseModel):
    subscription_id: str
    razorpay_key_id: str


class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_subscription_id: str
    razorpay_signature: str


class SubscriptionDetailResponse(BaseModel):
    id: str
    plan: str
    status: str
    razorpay_subscription_id: str | None
    current_period_end: str | None
    launches_per_month: int
    launches_used: int


class BillingEventResponse(BaseModel):
    id: str
    event_type: str
    amount_paise: int
    currency: str
    status: str
    receipt_url: str | None
    created_at: str


class BillingHistoryResponse(BaseModel):
    events: list[BillingEventResponse]


# ── Webhook Event Handlers ────────────────────────────────────

def _handle_subscription_activated(payload: dict) -> None:
    """Handle subscription.activated webhook event.

    Updates the subscriptions table with Razorpay IDs, sets the plan tier,
    and updates the user's launch quota.
    """
    subscription_data = payload.get("subscription", {}).get("entity", {})
    razorpay_subscription_id = subscription_data.get("id")
    razorpay_plan_id = subscription_data.get("plan_id")
    customer_email = subscription_data.get("notes", {}).get("customer_email")

    if not razorpay_subscription_id or not razorpay_plan_id:
        logger.warning(
            "subscription.activated: missing subscription_id or plan_id in payload"
        )
        return

    tier = _resolve_plan_tier(razorpay_plan_id)
    if not tier:
        logger.warning(
            f"subscription.activated: unrecognized plan_id={razorpay_plan_id}"
        )
        return

    quota = PLAN_QUOTAS[tier]
    sb = get_supabase_client()

    # Find the user by matching the subscription or email in notes
    # First try to find by razorpay_subscription_id (if already linked)
    result = sb.table("subscriptions").select("user_id").eq(
        "razorpay_subscription_id", razorpay_subscription_id
    ).execute()

    user_id = None
    if result.data:
        user_id = result.data[0]["user_id"]
    elif customer_email:
        # Fallback: find user by email
        profile_result = sb.table("profiles").select("id").eq(
            "email", customer_email
        ).execute()
        if profile_result.data:
            user_id = profile_result.data[0]["id"]

    if not user_id:
        logger.warning(
            f"subscription.activated: could not find user for subscription={razorpay_subscription_id}"
        )
        return

    now = datetime.now(timezone.utc)

    # Update subscription record
    sb.table("subscriptions").update({
        "razorpay_subscription_id": razorpay_subscription_id,
        "razorpay_plan_id": razorpay_plan_id,
        "plan": tier,
        "status": "active",
        "launches_per_month": quota,
        "current_period_start": now.isoformat(),
        "current_period_end": (now + timedelta(days=30)).isoformat(),
        "updated_at": now.isoformat(),
    }).eq("user_id", user_id).execute()

    # Update profile plan and quota
    sb.table("profiles").update({
        "plan": tier,
        "launches_remaining": quota,
        "is_trial": False,
    }).eq("id", user_id).execute()

    # Log billing event
    sb.table("billing_events").insert({
        "user_id": user_id,
        "event_type": "subscription.activated",
        "razorpay_subscription_id": razorpay_subscription_id,
        "status": "active",
    }).execute()

    logger.info(
        f"subscription.activated: user={user_id} plan={tier} quota={quota}"
    )


def _handle_subscription_charged(payload: dict) -> None:
    """Handle subscription.charged webhook event.

    Resets the user's launches_remaining to their plan's monthly allowance
    and updates the billing period dates.
    """
    subscription_data = payload.get("subscription", {}).get("entity", {})
    payment_data = payload.get("payment", {}).get("entity", {})
    razorpay_subscription_id = subscription_data.get("id")

    if not razorpay_subscription_id:
        logger.warning("subscription.charged: missing subscription_id in payload")
        return

    sb = get_supabase_client()

    # Find subscription by Razorpay ID
    result = sb.table("subscriptions").select(
        "user_id, plan, launches_per_month"
    ).eq("razorpay_subscription_id", razorpay_subscription_id).execute()

    if not result.data:
        logger.warning(
            f"subscription.charged: subscription not found for {razorpay_subscription_id}"
        )
        return

    sub = result.data[0]
    user_id = sub["user_id"]
    launches_per_month = sub["launches_per_month"]

    now = datetime.now(timezone.utc)
    period_end = now + timedelta(days=30)

    # Reset quota and update billing period
    sb.table("subscriptions").update({
        "current_period_start": now.isoformat(),
        "current_period_end": period_end.isoformat(),
        "updated_at": now.isoformat(),
    }).eq("razorpay_subscription_id", razorpay_subscription_id).execute()

    # Reset launches_remaining on profile
    sb.table("profiles").update({
        "launches_remaining": launches_per_month,
    }).eq("id", user_id).execute()

    # Log billing event
    amount_paise = payment_data.get("amount")
    razorpay_payment_id = payment_data.get("id")
    sb.table("billing_events").insert({
        "user_id": user_id,
        "event_type": "subscription.charged",
        "razorpay_payment_id": razorpay_payment_id,
        "razorpay_subscription_id": razorpay_subscription_id,
        "amount_paise": amount_paise,
        "currency": "INR",
        "status": "captured",
    }).execute()

    logger.info(
        f"subscription.charged: user={user_id} quota_reset_to={launches_per_month}"
    )


def _handle_subscription_cancelled(payload: dict) -> None:
    """Handle subscription.cancelled webhook event.

    Sets the subscription status to 'canceled' and schedules the downgrade
    to free at the end of the current billing period.
    """
    subscription_data = payload.get("subscription", {}).get("entity", {})
    razorpay_subscription_id = subscription_data.get("id")

    if not razorpay_subscription_id:
        logger.warning("subscription.cancelled: missing subscription_id in payload")
        return

    sb = get_supabase_client()

    # Find subscription
    result = sb.table("subscriptions").select(
        "user_id, current_period_end"
    ).eq("razorpay_subscription_id", razorpay_subscription_id).execute()

    if not result.data:
        logger.warning(
            f"subscription.cancelled: subscription not found for {razorpay_subscription_id}"
        )
        return

    sub = result.data[0]
    user_id = sub["user_id"]

    now = datetime.now(timezone.utc)

    # Set status to canceled — the user keeps access until current_period_end
    # The downgrade to free will happen at period end (handled by a scheduled job
    # or checked on next login/API call)
    sb.table("subscriptions").update({
        "status": "canceled",
        "updated_at": now.isoformat(),
    }).eq("razorpay_subscription_id", razorpay_subscription_id).execute()

    # Log billing event
    sb.table("billing_events").insert({
        "user_id": user_id,
        "event_type": "subscription.cancelled",
        "razorpay_subscription_id": razorpay_subscription_id,
        "status": "canceled",
    }).execute()

    logger.info(
        f"subscription.cancelled: user={user_id} — will downgrade at period end"
    )


def _handle_payment_failed(payload: dict) -> None:
    """Handle payment.failed webhook event.

    Sets the subscription status to 'past_due' and flags a notification
    for the user (stored in billing_events for the next API response to pick up).
    """
    payment_data = payload.get("payment", {}).get("entity", {})
    razorpay_payment_id = payment_data.get("id")
    # The subscription ID may be in the payment entity's notes or invoice
    razorpay_subscription_id = payment_data.get("subscription_id")

    if not razorpay_subscription_id:
        # Try to extract from notes
        notes = payment_data.get("notes", {})
        razorpay_subscription_id = notes.get("subscription_id")

    if not razorpay_subscription_id:
        logger.warning(
            f"payment.failed: could not determine subscription_id from payment={razorpay_payment_id}"
        )
        return

    sb = get_supabase_client()

    # Find subscription
    result = sb.table("subscriptions").select("user_id").eq(
        "razorpay_subscription_id", razorpay_subscription_id
    ).execute()

    if not result.data:
        logger.warning(
            f"payment.failed: subscription not found for {razorpay_subscription_id}"
        )
        return

    user_id = result.data[0]["user_id"]
    now = datetime.now(timezone.utc)

    # Set subscription to past_due
    sb.table("subscriptions").update({
        "status": "past_due",
        "updated_at": now.isoformat(),
    }).eq("razorpay_subscription_id", razorpay_subscription_id).execute()

    # Log billing event (serves as notification flag for the user)
    sb.table("billing_events").insert({
        "user_id": user_id,
        "event_type": "payment.failed",
        "razorpay_payment_id": razorpay_payment_id,
        "razorpay_subscription_id": razorpay_subscription_id,
        "amount_paise": payment_data.get("amount"),
        "currency": "INR",
        "status": "failed",
    }).execute()

    logger.info(
        f"payment.failed: user={user_id} subscription={razorpay_subscription_id} — set to past_due"
    )


def _handle_subscription_failed(payload: dict) -> None:
    """Handle subscription.failed webhook event.

    Sets the subscription status to 'past_due' and flags a notification.
    """
    subscription_data = payload.get("subscription", {}).get("entity", {})
    razorpay_subscription_id = subscription_data.get("id")

    if not razorpay_subscription_id:
        logger.warning("subscription.failed: missing subscription_id in payload")
        return

    sb = get_supabase_client()

    # Find subscription
    result = sb.table("subscriptions").select("user_id").eq(
        "razorpay_subscription_id", razorpay_subscription_id
    ).execute()

    if not result.data:
        logger.warning(
            f"subscription.failed: subscription not found for {razorpay_subscription_id}"
        )
        return

    user_id = result.data[0]["user_id"]
    now = datetime.now(timezone.utc)

    # Set subscription to past_due
    sb.table("subscriptions").update({
        "status": "past_due",
        "updated_at": now.isoformat(),
    }).eq("razorpay_subscription_id", razorpay_subscription_id).execute()

    # Log billing event
    sb.table("billing_events").insert({
        "user_id": user_id,
        "event_type": "subscription.failed",
        "razorpay_subscription_id": razorpay_subscription_id,
        "status": "failed",
    }).execute()

    logger.info(
        f"subscription.failed: user={user_id} subscription={razorpay_subscription_id} — set to past_due"
    )


# ── Webhook Endpoint ──────────────────────────────────────────

WEBHOOK_HANDLERS = {
    "subscription.activated": _handle_subscription_activated,
    "subscription.charged": _handle_subscription_charged,
    "subscription.cancelled": _handle_subscription_cancelled,
    "subscription.failed": _handle_subscription_failed,
    "payment.failed": _handle_payment_failed,
}


@router.post("/webhook")
async def razorpay_webhook(request: Request):
    """Process Razorpay webhook events.

    This endpoint does NOT require authentication — it is verified
    by the Razorpay webhook signature (X-Razorpay-Signature header).
    """
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    # Verify webhook signature
    if not signature or not verify_webhook_signature(body, signature):
        logger.warning(
            f"Webhook signature verification failed. "
            f"IP={request.client.host if request.client else 'unknown'}"
        )
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    # Parse the event payload
    payload = await request.json()
    event_type = payload.get("event")

    handler = WEBHOOK_HANDLERS.get(event_type)
    if handler:
        try:
            handler(payload.get("payload", {}))
        except Exception as e:
            logger.error(f"Webhook handler error for {event_type}: {e}", exc_info=True)
            # Return 200 to acknowledge receipt even on handler errors
            # (prevents Razorpay from retrying indefinitely)
            return {"status": "error", "message": "Handler failed but event acknowledged"}
    else:
        logger.info(f"Webhook event '{event_type}' received but no handler registered")

    return {"status": "ok"}


# ── Billing Endpoints (placeholder structure for task 6.4) ────

@router.post("/create-subscription", response_model=CreateSubscriptionResponse)
async def create_subscription_endpoint(
    req: CreateSubscriptionRequest,
    user: dict = Depends(get_current_user),
):
    """Create a Razorpay subscription for the authenticated user."""
    settings = get_settings()

    plan_map = {
        "pro_monthly": settings.razorpay_plan_id_pro_monthly,
        "pro_yearly": settings.razorpay_plan_id_pro_yearly,
        "team_monthly": settings.razorpay_plan_id_team_monthly,
        "team_yearly": settings.razorpay_plan_id_team_yearly,
    }

    plan_id = plan_map.get(req.plan)
    if not plan_id:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {req.plan}")

    try:
        subscription = rz_create_subscription(plan_id, user["email"])
    except Exception as e:
        logger.error(f"Razorpay create subscription failed: {e}")
        raise HTTPException(status_code=502, detail="Payment service unavailable")

    # Link the subscription to the user's record
    sb = get_supabase_client()
    sb.table("subscriptions").update({
        "razorpay_subscription_id": subscription["id"],
        "razorpay_plan_id": plan_id,
    }).eq("user_id", user["id"]).execute()

    return CreateSubscriptionResponse(
        subscription_id=subscription["id"],
        razorpay_key_id=settings.razorpay_key_id,
    )


@router.post("/verify-payment")
async def verify_payment_endpoint(
    req: VerifyPaymentRequest,
    user: dict = Depends(get_current_user),
):
    """Verify Razorpay payment signature and activate subscription.

    If the user is currently in a trial, immediately transition to the paid plan
    by canceling the trial (sets is_trial=False).
    """
    if not verify_payment_signature(
        req.razorpay_payment_id,
        req.razorpay_subscription_id,
        req.razorpay_signature,
    ):
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    sb = get_supabase_client()
    settings = get_settings()

    # Find the subscription record for this user
    sub_result = sb.table("subscriptions").select(
        "razorpay_plan_id, plan"
    ).eq("user_id", user["id"]).execute()

    # Determine the plan tier from the razorpay_plan_id
    tier = None
    if sub_result.data:
        razorpay_plan_id = sub_result.data[0].get("razorpay_plan_id")
        if razorpay_plan_id:
            tier = _resolve_plan_tier(razorpay_plan_id)

    # If we couldn't resolve from subscription record, try to resolve from the subscription ID
    if not tier:
        # Default to pro if we can't determine (webhook will correct later)
        tier = "pro"

    quota = PLAN_QUOTAS[tier]
    now = datetime.now(timezone.utc)

    # Update subscription record
    sb.table("subscriptions").update({
        "razorpay_subscription_id": req.razorpay_subscription_id,
        "plan": tier,
        "status": "active",
        "launches_per_month": quota,
        "current_period_start": now.isoformat(),
        "current_period_end": (now + timedelta(days=30)).isoformat(),
        "updated_at": now.isoformat(),
    }).eq("user_id", user["id"]).execute()

    # Update profile plan and quota
    sb.table("profiles").update({
        "plan": tier,
        "launches_remaining": quota,
        "is_trial": False,
    }).eq("id", user["id"]).execute()

    # Log billing event with amount
    # Determine amount from plan
    plan_amounts = {
        "pro": 49900,   # ₹499 in paise
        "team": 149900, # ₹1,499 in paise
    }
    amount_paise = plan_amounts.get(tier, 0)

    sb.table("billing_events").insert({
        "user_id": user["id"],
        "event_type": "payment.verified",
        "razorpay_payment_id": req.razorpay_payment_id,
        "razorpay_subscription_id": req.razorpay_subscription_id,
        "amount_paise": amount_paise,
        "status": "captured",
        "currency": "INR",
    }).execute()

    logger.info(
        f"verify-payment: user={user['id']} plan={tier} quota={quota} — activated immediately"
    )

    return {
        "status": "verified",
        "plan": tier,
        "launches_per_month": quota,
    }


@router.get("/subscription", response_model=SubscriptionDetailResponse)
async def get_subscription(
    user: dict = Depends(get_current_user),
):
    """Get the current user's subscription details."""
    sb = get_supabase_client()

    sub_result = sb.table("subscriptions").select("*").eq(
        "user_id", user["id"]
    ).execute()

    if not sub_result.data:
        raise HTTPException(status_code=404, detail="Subscription not found")

    sub = sub_result.data[0]

    # Get profile for launches_remaining
    profile_result = sb.table("profiles").select(
        "launches_remaining"
    ).eq("id", user["id"]).single().execute()

    launches_remaining = profile_result.data.get("launches_remaining", 0) if profile_result.data else 0
    launches_used = sub["launches_per_month"] - launches_remaining

    return SubscriptionDetailResponse(
        id=sub["id"],
        plan=sub["plan"],
        status=sub["status"],
        razorpay_subscription_id=sub.get("razorpay_subscription_id"),
        current_period_end=sub.get("current_period_end"),
        launches_per_month=sub["launches_per_month"],
        launches_used=max(0, launches_used),
    )


@router.post("/cancel")
async def cancel_subscription_endpoint(
    user: dict = Depends(get_current_user),
):
    """Cancel the user's active Razorpay subscription."""
    sb = get_supabase_client()

    sub_result = sb.table("subscriptions").select(
        "razorpay_subscription_id, status"
    ).eq("user_id", user["id"]).execute()

    if not sub_result.data:
        raise HTTPException(status_code=404, detail="Subscription not found")

    sub = sub_result.data[0]
    razorpay_sub_id = sub.get("razorpay_subscription_id")

    if not razorpay_sub_id:
        raise HTTPException(status_code=400, detail="No active paid subscription to cancel")

    if sub["status"] == "canceled":
        raise HTTPException(status_code=400, detail="Subscription is already canceled")

    try:
        rz_cancel_subscription(razorpay_sub_id)
    except Exception as e:
        logger.error(f"Razorpay cancel subscription failed: {e}")
        raise HTTPException(status_code=502, detail="Payment service unavailable")

    return {"status": "canceled", "message": "Subscription will be canceled at end of billing period"}


@router.get("/history", response_model=BillingHistoryResponse)
async def get_billing_history(
    user: dict = Depends(get_current_user),
):
    """Get the user's billing history."""
    sb = get_supabase_client()

    try:
        result = sb.table("billing_events").select("*").eq(
            "user_id", user["id"]
        ).order("created_at", desc=True).execute()
    except Exception as e:
        # Table may not exist yet if migration hasn't been applied
        logger.warning(f"billing_events query failed (migration may be pending): {e}")
        return BillingHistoryResponse(events=[])

    events = []
    for event in result.data or []:
        events.append(BillingEventResponse(
            id=event["id"],
            event_type=event["event_type"],
            amount_paise=event.get("amount_paise") or 0,
            currency=event.get("currency", "INR"),
            status=event.get("status", ""),
            receipt_url=event.get("receipt_url"),
            created_at=event["created_at"],
        ))

    return BillingHistoryResponse(events=events)
