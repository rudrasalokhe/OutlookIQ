/**
 * PAGE — Institutional Profile & MongoDB Settings (Neo-Brutalist Design)
 * Manage analyst identity, rotate institutional API keys, and connect
 * MongoDB connection strings with live diagnostic validation.
 */

import { authService } from "../auth.js";
import { showToast } from "../components.js";

export async function renderProfile(container) {
  let profileData = await authService.getProfile();
  let dbStatus = await authService.getDbStatus();
  let user = profileData.user || authService.getUser();

  function updateView() {
    const isMongoConnected = dbStatus.connected;

    container.innerHTML = `
      <!-- Header -->
      <header class="header">
        <div class="header-title">
          <h1>Institutional Profile</h1>
          <div class="badge">Security & Data Desk</div>
          <span style="margin-left: 12px; font-weight: 700; font-size: 0.9rem;">
            ${user.organization || "Apex Capital Management"} &bull; ${user.role || "Lead Quantitative Strategist"}
          </span>
        </div>
        <div class="header-actions">
          <span class="badge" style="background: ${isMongoConnected ? 'var(--main-teal)' : 'var(--main-yellow)'};">
            <i class="fas fa-database"></i> ${isMongoConnected ? 'MongoDB Connected' : 'Local Fallback Mode'}
          </span>
          <button id="btn-profile-signout" class="brutal-btn" style="background: #fff;">
            <i class="fas fa-sign-out-alt"></i> Sign Out
          </button>
        </div>
      </header>

      <!-- Main Profile Grid -->
      <div style="display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 24px; align-items: start;">
        
        <!-- Left Column: User Identity & MongoDB Status Card -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          
          <!-- Identity Summary Card -->
          <div class="brutal-card" style="padding: 24px; text-align: center; align-items: center;">
            <div style="width: 80px; height: 80px; background: var(--main-yellow); border: 3px solid var(--border-color); box-shadow: 4px 4px 0px var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; margin-bottom: 16px;">
              ${(user.full_name || "RS").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <h2 style="font-size: 1.35rem; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;" id="disp-user-name">
              ${user.full_name}
            </h2>
            <div style="font-size: 0.85rem; font-weight: 700; color: #555; margin-bottom: 12px;" id="disp-user-email">
              ${user.email}
            </div>
            <div class="badge" style="background: #000; color: #fff; margin-bottom: 16px;">
              ${user.tier || "Institutional Research Desk"}
            </div>

            <div class="brutal-border" style="width: 100%; background: #fdfae7; padding: 12px; text-align: left; font-size: 0.75rem; display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: 700; color: #666;">Desk:</span>
                <strong>${user.organization}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: 700; color: #666;">Focus:</span>
                <strong>${user.investment_focus || "Big Tech & Semis"}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: 700; color: #666;">Audit Mode:</span>
                <strong style="background: var(--main-teal); padding: 1px 4px;">${user.guidance_tolerance || "Strict"}</strong>
              </div>
            </div>
          </div>

          <!-- MongoDB Configuration Card -->
          <div class="brutal-card bg-yellow" style="padding: 24px;">
            <div class="stat-label" style="font-size: 0.8rem; margin-bottom: 12px; display: flex; justify-content: space-between; border-color: #000;">
              <span>MongoDB Integration</span>
              <span class="badge" style="background: #fff; font-size: 0.65rem; padding: 1px 5px;">
                ${isMongoConnected ? 'ONLINE' : 'CONFIG'}
              </span>
            </div>
            
            <p style="font-size: 0.8rem; font-weight: 600; line-height: 1.4; margin-bottom: 14px;">
              Enter your MongoDB connection string (Atlas or local) to enable persistent multi-user audit logging and watchlist sync.
            </p>

            <form id="form-mongo-connect" style="display: flex; flex-direction: column; gap: 10px;">
              <div>
                <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">
                  MongoDB URI
                </label>
                <input
                  type="password"
                  id="mongo-uri-input"
                  placeholder="mongodb+srv://user:pass@cluster.mongodb.net/..."
                  class="brutal-border"
                  style="width: 100%; padding: 10px; font-size: 0.8rem; font-family: monospace; background: #fff;"
                  autocomplete="off"
                />
              </div>

              <div>
                <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">
                  Database Name
                </label>
                <input
                  type="text"
                  id="mongo-dbname-input"
                  value="${dbStatus.database === 'local_fallback' ? 'outlookiq' : dbStatus.database}"
                  class="brutal-border"
                  style="width: 100%; padding: 8px 10px; font-size: 0.8rem; font-weight: 700; background: #fff;"
                />
              </div>

              <button type="submit" id="btn-save-mongo" class="brutal-btn" style="background: #000; color: #fff; justify-content: center; margin-top: 4px;">
                <i class="fas fa-plug"></i> Connect MongoDB
              </button>
            </form>

            <div id="mongo-status-box" class="brutal-border" style="background: #fff; padding: 10px; margin-top: 12px; font-size: 0.75rem; font-weight: 600;">
              <div style="font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Status:</div>
              <div id="mongo-status-text" style="color: ${isMongoConnected ? 'green' : '#666'};">
                ${dbStatus.message}
              </div>
            </div>
          </div>

        </div>

        <!-- Right Column: Profile Editor, API Key & Watchlist -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          
          <!-- Profile Details Editor Form -->
          <div class="brutal-card" style="padding: 28px; background: #fff;">
            <div class="stat-label" style="font-size: 0.85rem; margin-bottom: 16px;">
              Analyst Account Settings
            </div>

            <form id="form-profile-edit" style="display: flex; flex-direction: column; gap: 16px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="prof-fullname"
                    value="${user.full_name || ''}"
                    class="brutal-border"
                    style="width: 100%; padding: 10px; font-weight: 700; font-family: var(--font-sans);"
                    required
                  />
                </div>
                <div>
                  <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="prof-email"
                    value="${user.email || ''}"
                    class="brutal-border"
                    style="width: 100%; padding: 10px; font-weight: 700; font-family: var(--font-sans); background: #f0f0f0;"
                    disabled
                  />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">
                    Organization / Firm
                  </label>
                  <input
                    type="text"
                    id="prof-org"
                    value="${user.organization || ''}"
                    class="brutal-border"
                    style="width: 100%; padding: 10px; font-weight: 700; font-family: var(--font-sans);"
                  />
                </div>
                <div>
                  <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">
                    Role / Desk
                  </label>
                  <input
                    type="text"
                    id="prof-role"
                    value="${user.role || ''}"
                    class="brutal-border"
                    style="width: 100%; padding: 10px; font-weight: 700; font-family: var(--font-sans);"
                  />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">
                    Primary Sector Focus
                  </label>
                  <select id="prof-focus" class="brutal-select" style="width: 100%; padding: 10px;">
                    <option value="Big Tech & AI Semiconductors" ${user.investment_focus?.includes('Semiconductors') ? 'selected' : ''}>Big Tech & AI Semiconductors</option>
                    <option value="Enterprise Cloud & SaaS" ${user.investment_focus?.includes('SaaS') ? 'selected' : ''}>Enterprise Cloud & SaaS</option>
                    <option value="Hardware & Consumer Tech" ${user.investment_focus?.includes('Hardware') ? 'selected' : ''}>Hardware & Consumer Tech</option>
                    <option value="Cross-Asset Macro Guidance" ${user.investment_focus?.includes('Macro') ? 'selected' : ''}>Cross-Asset Macro Guidance</option>
                  </select>
                </div>
                <div>
                  <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">
                    Guidance Corridor Tolerance
                  </label>
                  <select id="prof-tolerance" class="brutal-select" style="width: 100%; padding: 10px;">
                    <option value="Strict Corridors (±2.5%)" ${user.guidance_tolerance?.includes('Strict') ? 'selected' : ''}>Strict Corridors (±2.5%)</option>
                    <option value="Standard Corridors (±5.0%)" ${user.guidance_tolerance?.includes('Standard') ? 'selected' : ''}>Standard Corridors (±5.0%)</option>
                    <option value="Permissive Corridors (±7.5%)" ${user.guidance_tolerance?.includes('Permissive') ? 'selected' : ''}>Permissive Corridors (±7.5%)</option>
                  </select>
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
                <button type="submit" class="brutal-btn" style="background: var(--main-yellow); padding: 12px 24px;">
                  <i class="fas fa-save"></i> Save Profile Details
                </button>
              </div>
            </form>
          </div>

          <!-- Institutional API Key Card -->
          <div class="brutal-card" style="padding: 24px; background: #fff;">
            <div class="stat-label" style="font-size: 0.85rem; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <span>Institutional API Key (Direct ChromaDB & Chat Access)</span>
              <span class="badge" style="background: var(--main-teal); font-size: 0.7rem; padding: 2px 6px;">Active</span>
            </div>

            <p style="font-size: 0.8rem; font-weight: 600; color: #555; margin-bottom: 14px;">
              Use this key to authenticate programmatic requests to the OutlookIQ RAG retrieval and promise auditing endpoints.
            </p>

            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 12px;">
              <input
                type="text"
                id="api-key-display"
                value="${user.api_key || 'oq_live_8f3a9e2d1c7b4056a9e18b44'}"
                class="brutal-border"
                style="flex: 1; padding: 10px 14px; font-family: monospace; font-size: 0.85rem; font-weight: 700; background: #fdfae7;"
                readonly
              />
              <button id="btn-copy-key" class="brutal-btn" style="background: #fff;" title="Copy to Clipboard">
                <i class="fas fa-copy"></i> Copy
              </button>
              <button id="btn-rotate-key" class="brutal-btn" style="background: var(--main-pink);" title="Generate New Key">
                <i class="fas fa-sync-alt"></i> Rotate
              </button>
            </div>
            <div style="font-size: 0.75rem; font-weight: 600; color: #666;">
              Header usage: <code>Authorization: Bearer ${user.api_key || 'oq_live_...'}</code>
            </div>
          </div>

          <!-- Fast Account Switcher / Register Tab -->
          <div class="brutal-card bg-teal" style="padding: 20px; flex-direction: row; justify-content: space-between; align-items: center;">
            <div>
              <strong style="text-transform: uppercase; font-size: 0.95rem;">Switch Analyst Identity</strong>
              <div style="font-size: 0.8rem; font-weight: 600; color: #111;">
                Create new institutional account or log in with corporate credentials.
              </div>
            </div>
            <div style="display: flex; gap: 10px;">
              <button id="btn-open-login" class="brutal-btn" style="background: #fff;">
                <i class="fas fa-key"></i> Switch Login
              </button>
            </div>
          </div>

        </div>

      </div>

      <!-- Quick Auth Modal Container -->
      <div id="auth-modal" class="evidence-drawer-backdrop" style="display: flex; align-items: center; justify-content: center; padding: 24px;">
        <div class="brutal-card" style="width: 100%; max-width: 480px; background: #fff; padding: 28px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid var(--border-color); padding-bottom: 12px; margin-bottom: 18px;">
            <h3 style="font-size: 1.25rem; font-weight: 700; text-transform: uppercase;" id="auth-modal-title">Sign In to OutlookIQ</h3>
            <button id="auth-modal-close" class="brutal-btn" style="padding: 2px 8px;">&times;</button>
          </div>

          <!-- Auth Tab Toggle -->
          <div style="display: flex; gap: 8px; margin-bottom: 16px;">
            <button id="tab-login" class="brutal-btn" style="flex: 1; justify-content: center; background: var(--main-yellow);">Sign In</button>
            <button id="tab-register" class="brutal-btn" style="flex: 1; justify-content: center; background: #fff;">Register</button>
          </div>

          <!-- Form Area -->
          <form id="form-auth-modal" style="display: flex; flex-direction: column; gap: 12px;">
            <div id="field-name-group" style="display: none;">
              <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">Full Name</label>
              <input type="text" id="auth-input-name" placeholder="Rudra Salokhe" class="brutal-border" style="width: 100%; padding: 10px; font-weight: 700;" />
            </div>

            <div>
              <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">Email</label>
              <input type="email" id="auth-input-email" placeholder="" autocomplete="off" class="brutal-border" style="width: 100%; padding: 10px; font-weight: 700;" required />
            </div>

            <div>
              <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">Password</label>
              <input type="password" id="auth-input-password" placeholder="" autocomplete="new-password" class="brutal-border" style="width: 100%; padding: 10px; font-weight: 700;" required />
            </div>

            <button type="submit" id="auth-submit-btn" class="brutal-btn" style="background: var(--main-yellow); justify-content: center; padding: 12px; margin-top: 6px;">
              <span>Authenticate Session</span>
            </button>
          </form>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    // Connect MongoDB Form
    const mongoForm = document.getElementById("form-mongo-connect");
    mongoForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const uri = document.getElementById("mongo-uri-input").value.trim();
      const dbName = document.getElementById("mongo-dbname-input").value.trim() || "outlookiq";
      if (!uri) {
        showToast("Please enter a MongoDB connection URI.");
        return;
      }

      showToast("Connecting to MongoDB...");
      try {
        const res = await authService.connectMongo(uri, dbName);
        dbStatus = res;
        document.getElementById("mongo-status-text").textContent = res.message;
        document.getElementById("mongo-status-text").style.color = res.connected ? "green" : "red";
        showToast("MongoDB Status Updated", res.message);
      } catch (err) {
        showToast("MongoDB Error", err.message);
      }
    });

    // Save Profile Form
    const profileForm = document.getElementById("form-profile-edit");
    profileForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const updates = {
        full_name: document.getElementById("prof-fullname").value.trim(),
        organization: document.getElementById("prof-org").value.trim(),
        role: document.getElementById("prof-role").value.trim(),
        investment_focus: document.getElementById("prof-focus").value,
        guidance_tolerance: document.getElementById("prof-tolerance").value
      };

      try {
        user = await authService.updateProfile(updates);
        document.getElementById("disp-user-name").textContent = user.full_name;
        showToast("Profile Updated", "Institutional settings saved successfully.");
      } catch (err) {
        showToast("Error updating profile", err.message);
      }
    });

    // Copy API Key
    document.getElementById("btn-copy-key")?.addEventListener("click", () => {
      const keyVal = document.getElementById("api-key-display").value;
      navigator.clipboard.writeText(keyVal).then(() => {
        showToast("API Key Copied to clipboard!");
      });
    });

    // Rotate API Key
    document.getElementById("btn-rotate-key")?.addEventListener("click", async () => {
      const newKey = await authService.rotateApiKey();
      document.getElementById("api-key-display").value = newKey;
      showToast("API Key Rotated", "New institutional live key generated.");
    });

    // Sign Out
    document.getElementById("btn-profile-signout")?.addEventListener("click", () => {
      authService.logout();
      showToast("Signed Out", "Switched to demo mode.");
      setTimeout(() => {
        window.location.hash = "#overview";
      }, 500);
    });

    // Auth Modal Logic
    const authModal = document.getElementById("auth-modal");
    let isRegisterMode = false;

    function openModal(register = false) {
      isRegisterMode = register;
      authModal.classList.add("open");
      updateModalTabs();
    }

    function closeModal() {
      authModal.classList.remove("open");
    }

    function updateModalTabs() {
      const title = document.getElementById("auth-modal-title");
      const nameGroup = document.getElementById("field-name-group");
      const submitBtn = document.getElementById("auth-submit-btn");
      const tabLogin = document.getElementById("tab-login");
      const tabRegister = document.getElementById("tab-register");

      if (isRegisterMode) {
        title.textContent = "Register Institutional Account";
        nameGroup.style.display = "block";
        submitBtn.innerHTML = "<span>Create Account &bull; Initialize Mongo</span>";
        tabRegister.style.background = "var(--main-yellow)";
        tabLogin.style.background = "#fff";
      } else {
        title.textContent = "Sign In to OutlookIQ";
        nameGroup.style.display = "none";
        submitBtn.innerHTML = "<span>Authenticate Session</span>";
        tabLogin.style.background = "var(--main-yellow)";
        tabRegister.style.background = "#fff";
      }
    }

    document.getElementById("btn-open-login")?.addEventListener("click", () => openModal(false));
    document.getElementById("auth-modal-close")?.addEventListener("click", closeModal);
    document.getElementById("tab-login")?.addEventListener("click", () => { isRegisterMode = false; updateModalTabs(); });
    document.getElementById("tab-register")?.addEventListener("click", () => { isRegisterMode = true; updateModalTabs(); });

    document.getElementById("form-auth-modal")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("auth-input-email").value.trim();
      const password = document.getElementById("auth-input-password").value.trim();
      const fullName = document.getElementById("auth-input-name").value.trim();

      try {
        if (isRegisterMode) {
          const res = await authService.register({ email, password, full_name: fullName });
          user = res.user;
          showToast("Account Registered", "Welcome to OutlookIQ.");
        } else {
          const res = await authService.login(email, password);
          user = res.user;
          showToast("Welcome Back", `Authenticated as ${user.full_name}`);
        }
        closeModal();
        updateView();
      } catch (err) {
        showToast("Authentication Error", err.message);
      }
    });
  }

  updateView();
}
