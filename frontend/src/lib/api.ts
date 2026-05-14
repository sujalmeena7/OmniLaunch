/* ============================================================
   OmniLaunch — API Client
   ============================================================
   
   ⚠️  SECURITY NOTE (Phase 6):
   Token storage currently uses localStorage, which is vulnerable to XSS.
   Before adding billing and real users, migrate to httpOnly cookies set
   by the backend. This is acceptable for development but MUST be changed
   before production deployment.
   ============================================================ */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
    return this.request<Record<string, unknown>>("/auth/me");
  }

  // ── Voice ─────────────────────────────────────────────────
  async trainVoice(name: string, samples: { type: string; value: string }[]) {
    return this.request("/train-voice", {
      method: "POST",
      body: JSON.stringify({ name, samples }),
    });
  }

  async listVoiceProfiles() {
    return this.request<{ profiles: Record<string, unknown>[] }>(
      "/voice-profiles"
    );
  }

  async getVoiceProfile(id: string) {
    return this.request(`/voice-profiles/${id}`);
  }

  async deleteVoiceProfile(id: string) {
    return this.request(`/voice-profiles/${id}`, { method: "DELETE" });
  }

  // ── Platforms ─────────────────────────────────────────────
  async listPlatforms() {
    return this.request<{ platforms: Record<string, unknown>[] }>("/platforms");
  }

  async getPlatformRules(platform: string, subTarget?: string) {
    const params = subTarget ? `?sub_target=${encodeURIComponent(subTarget)}` : "";
    return this.request(`/platforms/${platform}/rules${params}`);
  }

  async validatePost(platform: string, title: string, body: string, subTarget?: string) {
    const params = new URLSearchParams({ platform, title, body });
    if (subTarget) params.set("sub_target", subTarget);
    return this.request(`/platforms/validate?${params.toString()}`, {
      method: "POST",
    });
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
    return this.request("/generate-launch-bundle", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listBundles() {
    return this.request<{ bundles: Record<string, unknown>[] }>("/bundles");
  }

  async getBundle(id: string) {
    return this.request(`/bundles/${id}`);
  }

  async regeneratePost(bundleId: string, platform: string) {
    return this.request<{ post_id: string; status: string }>(
      `/bundles/${bundleId}/posts/${platform}/regenerate`,
      { method: "POST" }
    );
  }
}

export const api = new ApiClient();
