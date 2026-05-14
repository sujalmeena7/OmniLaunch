"""OmniLaunch — Rate Limiting Configuration.

Uses slowapi to protect expensive LLM endpoints from abuse.
Limits are per-IP by default; can be extended to per-user in production.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
