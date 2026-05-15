"""OmniLaunch — Razorpay Payment Service.

Wraps the razorpay Python SDK to provide subscription management,
payment verification, and webhook signature validation.
"""

import hashlib
import hmac

import razorpay

from app.config import get_settings


def _get_client() -> razorpay.Client:
    """Create and return a configured Razorpay client instance."""
    settings = get_settings()
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


def create_subscription(plan_id: str, customer_email: str) -> dict:
    """
    Create a Razorpay subscription for the given plan.

    Args:
        plan_id: The Razorpay plan ID (e.g. plan_XXXXX).
        customer_email: The customer's email address for notifications.

    Returns:
        A dict containing the subscription details from Razorpay,
        including 'id', 'plan_id', 'status', and 'short_url'.
    """
    client = _get_client()
    subscription = client.subscription.create({
        "plan_id": plan_id,
        "total_count": 12,  # Max billing cycles (monthly for 1 year)
        "customer_notify": 1,
        "notes": {
            "customer_email": customer_email,
        },
    })
    return subscription


def verify_payment_signature(
    payment_id: str,
    subscription_id: str,
    signature: str,
) -> bool:
    """
    Verify a Razorpay payment signature using HMAC-SHA256.

    The expected signature is computed as:
        HMAC-SHA256(key_secret, payment_id + "|" + subscription_id)

    Args:
        payment_id: The razorpay_payment_id from checkout.
        subscription_id: The razorpay_subscription_id from checkout.
        signature: The razorpay_signature provided by checkout.

    Returns:
        True if the signature is valid, False otherwise.
    """
    settings = get_settings()
    message = f"{payment_id}|{subscription_id}"
    expected = hmac.HMAC(
        key=settings.razorpay_key_secret.encode("utf-8"),
        msg=message.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    """
    Verify a Razorpay webhook signature using HMAC-SHA256.

    The expected signature is computed as:
        HMAC-SHA256(webhook_secret, raw_request_body)

    Args:
        body: The raw request body bytes from the webhook POST.
        signature: The X-Razorpay-Signature header value.

    Returns:
        True if the signature is valid, False otherwise.
    """
    settings = get_settings()
    expected = hmac.HMAC(
        key=settings.razorpay_webhook_secret.encode("utf-8"),
        msg=body,
        digestmod=hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def cancel_subscription(subscription_id: str) -> dict:
    """
    Cancel an active Razorpay subscription.

    The subscription will be cancelled at the end of the current billing
    period (cancel_at_cycle_end=True).

    Args:
        subscription_id: The Razorpay subscription ID to cancel.

    Returns:
        A dict containing the updated subscription details from Razorpay.
    """
    client = _get_client()
    return client.subscription.cancel(subscription_id, {"cancel_at_cycle_end": 1})


def fetch_payments(customer_id: str) -> list[dict]:
    """
    Fetch payment history for a customer from Razorpay.

    Args:
        customer_id: The Razorpay customer ID.

    Returns:
        A list of payment dicts containing payment details.
    """
    client = _get_client()
    response = client.payment.all({"count": 100})
    # Filter payments for this customer
    payments = [
        p for p in response.get("items", [])
        if p.get("customer_id") == customer_id
    ]
    return payments
