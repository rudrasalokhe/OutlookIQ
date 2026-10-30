/**
 * OutlookIQ Authentication & Institutional Identity Service
 * Handles JWT token storage, user profiles, login/register state,
 * and MongoDB runtime connection testing.
 */

const TOKEN_KEY = "outlookiq_auth_token";
const USER_KEY = "outlookiq_user_data";
const API_BASE = "http://127.0.0.1:8000/api";

export class AuthService {
  constructor() {
    try {
      this.token = (typeof localStorage !== "undefined" && localStorage.getItem(TOKEN_KEY)) || null;
    } catch {
      this.token = null;
    }
    this.user = this.loadStoredUser();
  }

  loadStoredUser() {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(USER_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch {
      // Fallback
    }
    // Default institutional demo identity
    return {
      _id: "demo-rudra",
      email: "rudra@outlookiq.internal",
      full_name: "Rudra Salokhe",
      organization: "Apex Capital Management",
      role: "Lead Quantitative Strategist",
      tier: "Institutional Tier",
      investment_focus: "Big Tech & AI Semiconductors",
      guidance_tolerance: "Strict Corridors (±2.5%)",
      api_key: "oq_live_8f3a9e2d1c7b4056a9e18b44",
      watchlist: ["NVDA", "MSFT", "AAPL", "GOOGL", "AMZN"]
    };
  }

  safeGet(key) {
    try {
      return (typeof localStorage !== "undefined" && localStorage.getItem(key)) || null;
    } catch {
      return null;
    }
  }

  safeSet(key, val) {
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(key, val);
    } catch {
      // Ignored
    }
  }

  safeRemove(key) {
    try {
      if (typeof localStorage !== "undefined") localStorage.removeItem(key);
    } catch {
      // Ignored
    }
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return Boolean(this.token);
  }

  getAuthHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Authentication failed. Check your credentials.");
      }
      const data = await res.json();
      this.token = data.token;
      this.user = data.user;
      this.safeSet(TOKEN_KEY, data.token);
      this.safeSet(USER_KEY, JSON.stringify(data.user));
      return data;
    } catch (err) {
      throw err;
    }
  }

  async register(userData) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Registration failed. Try a different email.");
      }
      const data = await res.json();
      this.token = data.token;
      this.user = data.user;
      this.safeSet(TOKEN_KEY, data.token);
      this.safeSet(USER_KEY, JSON.stringify(data.user));
      return data;
    } catch (err) {
      throw err;
    }
  }

  logout() {
    this.token = null;
    this.safeRemove(TOKEN_KEY);
    // Keep local default profile for instant demo access
  }

  async getProfile() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        this.user = data.user;
        this.safeSet(USER_KEY, JSON.stringify(data.user));
        return data;
      }
    } catch (err) {
      console.warn("Could not fetch remote profile:", err);
    }
    return { user: this.user, database: { connected: false, message: "Local demo mode" } };
  }

  async updateProfile(updates) {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update profile.");
      }
      const data = await res.json();
      this.user = data.user;
      this.safeSet(USER_KEY, JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      // Update local storage in fallback mode
      Object.assign(this.user, updates);
      this.safeSet(USER_KEY, JSON.stringify(this.user));
      return this.user;
    }
  }

  async rotateApiKey() {
    try {
      const res = await fetch(`${API_BASE}/auth/api-key/rotate`, {
        method: "POST",
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        this.user.api_key = data.api_key;
        this.safeSet(USER_KEY, JSON.stringify(this.user));
        return data.api_key;
      }
    } catch (err) {
      console.warn("API key rotation fallback:", err);
    }
    const mockKey = `oq_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    this.user.api_key = mockKey;
    localStorage.setItem(USER_KEY, JSON.stringify(this.user));
    return mockKey;
  }

  async getDbStatus() {
    try {
      const res = await fetch(`${API_BASE}/auth/status`);
      if (res.ok) return await res.json();
    } catch (err) {
      // Fallback
    }
    return {
      connected: false,
      uri_configured: false,
      database: "local_storage",
      message: "Backend offline — using browser storage"
    };
  }

  async connectMongo(mongoUri, dbName = "outlookiq") {
    try {
      const res = await fetch(`${API_BASE}/auth/connect-mongo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mongo_uri: mongoUri, database_name: dbName })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to connect to MongoDB.");
      }
      return await res.json();
    } catch (err) {
      throw err;
    }
  }
}

export const authService = new AuthService();
