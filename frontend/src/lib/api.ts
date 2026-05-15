/* ============================================================
   OmniLaunch — API Client
   ============================================================
   
   ⚠️  SECURITY NOTE (Phase 6):
   Token storage currently uses localStorage, which is vulnerable to XSS.
   Before adding billing and real users, migrate to httpOnly cookies set
   by the backend. This is acceptable for development but MUST be changed
   before production deployment.
   ============================================================ */

import { useToastStore } from "@/stores/toastStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

/** Delays for exponential backoff retries (in ms) */
const RETRY_DELAYS = [500, 1000, 2000];
const MAX_RETRIES = 3;

export interface RetryState {
  isRetrying: boolean;
  attempt: number;
}

/** Global retry state listeners — components can subscribe to show loading indicators */
type RetryListener = (path: string, state: RetryState) => void;
const retryListeners = new Set<RetryListener>();

export function onRetryStateChange(listener: RetryListener): () => void {
  retryListeners.add(listener);
  return () => {
    retryListeners.delete(listener);
  };
}

function notifyRetryListeners(path: string, state: RetryState) {
  retryListeners.forEach((listener) => listener(path, state));
}

/** Determines if an HTTP status code should trigger a retry */
export function isRetryableStatus(status: number): boolean {
  return status >= 500 && status <= 599;
}

/** Determines if an error is a network error (fetch failure) */
function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && error.message.includes("fetch");
}

/** Parses the Retry-After header value into seconds */
export function parseRetryAfter(headerValue: string | null): number | null {
  if (!headerValue) return null;
  // Retry-After can be a number of seconds or an HTTP-date
  const seconds = parseInt(headerValue, 10);
  if (!isNaN(seconds)) return seconds;
  // Try parsing as a date
  const date = new Date(headerValue);
  if (!isNaN(date.getTime())) {
    const diffMs = date.getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / 1000));
  }
  return null;
}

/** Waits for the specified number of milliseconds */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("omnilaunch_token", token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("omnilaunch_token");
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("omnilaunch_token");
      localStorage.removeItem("omnilaunch_refresh");
    }
  }

  /**
   * Core request method with retry logic and toast integration.
   *
   * - 5xx and network errors: retry up to 3 times with exponential backoff (500ms, 1000ms, 2000ms)
   * - 4xx errors (except 429): no retry, immediate error toast
   * - 429: parse Retry-After header, show toast with reset time, no retry
   * - On final failure after retries: show error toast with manual retry action button
   * - On mutation success: show success toast
   */
  async requestWithRetry<T>(
    path: string,
    options: RequestInit = {},
    config: { retries?: number; isMutation?: boolean } = {}
  ): Promise<T> {
    const { retries = MAX_RETRIES, isMutation = false } = config;
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const fullOptions: RequestInit = { ...options, headers };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      // Notify listeners about retry state
      if (attempt > 0) {
        notifyRetryListeners(path, { isRetrying: true, attempt });
      }

      try {
        const res = await fetch(`${API_BASE}${path}`, fullOptions);

        if (res.ok) {
          // Clear retry state on success
          notifyRetryListeners(path, { isRetrying: false, attempt: 0 });

          // Show success toast for mutations
          if (isMutation) {
            useToastStore.getState().addToast({
              type: "success",
              message: "Operation completed successfully",
              duration: 3000,
            });
          }

          return await res.json() as T;
        }

        // Handle 429 — Rate Limited (special handling, no retry)
        if (res.status === 429) {
          notifyRetryListeners(path, { isRetrying: false, attempt: 0 });
          const retryAfterHeader = res.headers.get("Retry-After");
          const retryAfterSeconds = parseRetryAfter(retryAfterHeader);
          const resetMessage = retryAfterSeconds
            ? `Rate limited. Try again in ${retryAfterSeconds} second${retryAfterSeconds !== 1 ? "s" : ""}.`
            : "Rate limited. Please wait before trying again.";

          useToastStore.getState().addToast({
            type: "warning",
            message: resetMessage,
            duration: 5000,
          });

          const err = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(err.detail || resetMessage);
        }

        // Handle 4xx (non-429) — no retry, immediate error
        if (res.status >= 400 && res.status < 500) {
          notifyRetryListeners(path, { isRetrying: false, attempt: 0 });
          const err = await res.json().catch(() => ({ detail: res.statusText }));
          const errorMessage = err.detail || `API Error: ${res.status}`;

          useToastStore.getState().addToast({
            type: "error",
            message: errorMessage,
            duration: 5000,
          });

          throw new Error(errorMessage);
        }

        // Handle 5xx — retryable
        if (isRetryableStatus(res.status)) {
          const err = await res.json().catch(() => ({ detail: res.statusText }));
          lastError = new Error(err.detail || `Server Error: ${res.status}`);

          // If we have retries remaining, wait and try again
          if (attempt < retries) {
            await delay(RETRY_DELAYS[attempt]);
            continue;
          }
        }
      } catch (error) {
        // Network errors are retryable
        if (isNetworkError(error)) {
          lastError = error as Error;
          if (attempt < retries) {
            notifyRetryListeners(path, { isRetrying: true, attempt: attempt + 1 });
            await delay(RETRY_DELAYS[attempt]);
            continue;
          }
        } else {
          // Non-network, non-retryable errors (e.g., already handled 4xx/429 above)
          notifyRetryListeners(path, { isRetrying: false, attempt: 0 });
          throw error;
        }
      }
    }

    // All retries exhausted — show error toast with manual retry action
    notifyRetryListeners(path, { isRetrying: false, attempt: 0 });
    const errorMessage = lastError?.message || "Request failed after multiple attempts";

    useToastStore.getState().addToast({
      type: "error",
      message: errorMessage,
      duration: 5000,
      action: {
        label: "Retry",
        onClick: () => {
          this.requestWithRetry<T>(path, options, config).catch(() => {
            // Retry will handle its own toast on failure
          });
        },
      },
    });

    throw lastError || new Error(errorMessage);
  }

  /**
   * Legacy request method (no retry, no toast).
   * Kept for backward compatibility with auth flows that handle errors differently.
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `API Error: ${res.status}`);
    }

    return res.json();
  }

  // ── Auth ──────────────────────────────────────────────────
  async signup(email: string, password: string, displayName: string) {
    const data = await this.request<{
      access_token: string;
      refresh_token: string;
      user: Record<string, unknown>;
    }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
    this.setToken(data.access_token);
    if (typeof window !== "undefined") {
      localStorage.setItem("omnilaunch_refresh", data.refresh_token);
    }
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{
      access_token: string;
      refresh_token: string;
      user: Record<string, unknown>;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    if (typeof window !== "undefined") {
      localStorage.setItem("omnilaunch_refresh", data.refresh_token);
    }
    return data;
  }

  async getMe() {
    return this.requestWithRetry<Record<string, unknown>>("/auth/me");
  }

  // ── Voice ─────────────────────────────────────────────────
  async trainVoice(name: string, samples: { type: string; value: string }[]) {
    return this.requestWithRetry("/train-voice", {
      method: "POST",
      body: JSON.stringify({ name, samples }),
    }, { isMutation: true });
  }

  async listVoiceProfiles() {
    return this.requestWithRetry<{ profiles: Record<string, unknown>[] }>(
      "/voice-profiles"
    );
  }

  async getVoiceProfile(id: string) {
    return this.requestWithRetry(`/voice-profiles/${id}`);
  }

  async deleteVoiceProfile(id: string) {
    return this.requestWithRetry(`/voice-profiles/${id}`, { method: "DELETE" }, { isMutation: true });
  }

  // ── Platforms ─────────────────────────────────────────────
  async listPlatforms() {
    return this.requestWithRetry<{ platforms: Record<string, unknown>[] }>("/platforms");
  }

  async getPlatformRules(platform: string, subTarget?: string) {
    const params = subTarget ? `?sub_target=${encodeURIComponent(subTarget)}` : "";
    return this.requestWithRetry(`/platforms/${platform}/rules${params}`);
  }

  async validatePost(platform: string, title: string, body: string, subTarget?: string) {
    const params = new URLSearchParams({ platform, title, body });
    if (subTarget) params.set("sub_target", subTarget);
    return this.requestWithRetry(`/platforms/validate?${params.toString()}`, {
      method: "POST",
    }, { isMutation: true });
  }

  // ── Bundles ───────────────────────────────────────────────
  async generateBundle(data: {
    voice_profile_id: string;
    product: {
      name: string;
      description: string;
      url?: string;
      target_audience?: string;
      tech_stack?: string[];
    };
    targets: { platform: string; sub_target?: string }[];
  }) {
    return this.requestWithRetry("/generate-launch-bundle", {
      method: "POST",
      body: JSON.stringify(data),
    }, { isMutation: true });
  }

  async listBundles() {
    return this.requestWithRetry<{ bundles: Record<string, unknown>[] }>("/bundles");
  }

  async getBundle(id: string) {
    return this.requestWithRetry(`/bundles/${id}`);
  }

  async regeneratePost(bundleId: string, platform: string) {
    return this.requestWithRetry<{ post_id: string; status: string }>(
      `/bundles/${bundleId}/posts/${platform}/regenerate`,
      { method: "POST" },
      { isMutation: true }
    );
  }

  // ── Billing ───────────────────────────────────────────────
  async createSubscription(plan: string) {
    return this.requestWithRetry<{ subscription_id: string; razorpay_key_id: string }>(
      "/billing/create-subscription",
      {
        method: "POST",
        body: JSON.stringify({ plan }),
      },
      { isMutation: true }
    );
  }
}

export const api = new ApiClient();
