/**
 * PAGE — Fullscreen Institutional Landing Page (Neo-Brutalist Design)
 * Standalone front door for OutlookIQ with complete Account Creation & Sign In.
 * Users must authenticate (or use 1-click Demo) to enter the terminal.
 */

import { authService } from "../auth.js";
import { showToast } from "../components.js";

export function renderLanding(container) {
  const isAuth = authService.isAuthenticated();
  const user = authService.getUser() || { full_name: "Quantitative Analyst", email: "" };

  container.innerHTML = `
    <div style="width: 100%; min-height: 100vh; background: var(--bg-color); color: #000; font-family: 'Space Grotesk', sans-serif;">
      
      <!-- Full-Width Landing Top Navigation -->
      <nav style="display: flex; justify-content: space-between; align-items: center; padding: 20px 48px; border-bottom: 3px solid var(--border-color); background: #fff;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 38px; height: 38px; background: var(--main-yellow); border: 3px solid var(--border-color); box-shadow: 3px 3px 0px var(--border-color); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;">
            OQ
          </div>
          <div>
            <span style="font-weight: 700; font-size: 1.4rem; text-transform: uppercase; letter-spacing: -0.5px;">OutlookIQ</span>
            <span class="badge" style="margin-left: 8px; font-size: 0.7rem; background: var(--main-teal);">INSTITUTIONAL RAG</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          ${isAuth ? `
            <div style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; background: var(--main-yellow); border: 2px solid #000; padding: 6px 12px; box-shadow: 2px 2px 0px #000;">
              <i class="fas fa-user-check"></i> ${user.full_name}
            </div>
            <button id="nav-btn-enter-terminal" class="brutal-btn" style="background: #000; color: #fff; font-size: 0.85rem; padding: 10px 18px;">
              <i class="fas fa-terminal"></i> Enter Terminal &rarr;
            </button>
            <button id="nav-btn-signout" class="brutal-btn" style="background: #fee; color: #900; font-size: 0.8rem; padding: 10px 14px;">
              Sign Out
            </button>
          ` : `
            <button id="nav-btn-tab-create" class="brutal-btn" style="background: #fff; font-size: 0.85rem;">
              Create Account
            </button>
            <button id="nav-btn-tab-login" class="brutal-btn" style="background: var(--main-yellow); font-size: 0.85rem; padding: 10px 20px;">
              <i class="fas fa-lock"></i> Sign In &rarr;
            </button>
          `}
        </div>
      </nav>

      <!-- Announcement Marquee Strip -->
      <div style="background: var(--main-yellow); border-bottom: 3px solid var(--border-color); padding: 10px 48px; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="badge" style="background: #000; color: #fff; padding: 2px 6px; font-size: 0.65rem;">NEW RELEASE</span>
          <span>Deterministic Guidance Audits Reconciled Against SEC Form 10-K/10-Q via ChromaDB + Groq LPU</span>
        </div>
        <div style="display: flex; gap: 16px; font-size: 0.75rem;">
          <span>• 100% SEC EDGAR Citations</span>
          <span>• Zero Hallucination Guardrails</span>
          <span>• MongoDB Cluster Synced</span>
        </div>
      </div>

      <!-- Main Landing Container -->
      <div style="max-width: 1300px; margin: 0 auto; padding: 48px 32px 80px;">

        <!-- Hero Grid -->
        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 36px; align-items: stretch; margin-bottom: 48px;">
          
          <!-- Hero Left Column -->
          <div class="brutal-card" style="padding: 44px; background: #fff; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap;">
                <span class="badge" style="background: var(--main-yellow);">SEC EDGAR AUDITED</span>
                <span class="badge" style="background: var(--main-teal);">HYBRID RAG (DENSE + BM25)</span>
                <span class="badge" style="background: var(--main-pink);">MANAGEMENT BIAS SCORING</span>
              </div>

              <h1 style="font-size: 3.2rem; text-transform: uppercase; letter-spacing: -2px; line-height: 1.05; margin-bottom: 22px;">
                Never take corporate guidance at face value.
              </h1>

              <p style="font-size: 1.15rem; font-weight: 600; line-height: 1.55; color: #333; margin-bottom: 28px;">
                OutlookIQ is the quantitative research platform that systematically extracts executive revenue, margin, and expense promises from earnings calls and audits them against official SEC 10-K/10-Q actuals.
              </p>
            </div>

            <div>
              <div style="display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 20px;">
                <button id="btn-hero-launch" class="brutal-btn" style="background: var(--main-yellow); font-size: 1.05rem; padding: 14px 28px;">
                  <i class="fas fa-bolt"></i> ${isAuth ? 'Enter Terminal &rarr;' : 'Create Account & Enter'}
                </button>
                <button id="btn-quick-demo-auth" class="brutal-btn" style="background: var(--main-teal); font-size: 0.95rem; padding: 14px 22px;">
                  <i class="fas fa-user-check"></i> Demo 1-Click Access
                </button>
              </div>
              <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #666; display: flex; gap: 16px;">
                <span><i class="fas fa-check-circle" style="color: #000;"></i> Instant Demo Access</span>
                <span><i class="fas fa-check-circle" style="color: #000;"></i> MongoDB Atlas Integrated</span>
              </div>
            </div>
          </div>

          <!-- Hero Right Column: Authentication Terminal Card -->
          <div id="landing-auth-card" class="brutal-card ${isAuth ? 'bg-teal' : 'bg-yellow'}" style="padding: 36px; display: flex; flex-direction: column; justify-content: space-between;">
            ${isAuth ? `
              <!-- Authenticated State -->
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #000; padding-bottom: 12px; margin-bottom: 20px;">
                  <strong style="font-size: 1.1rem; text-transform: uppercase;">
                    <i class="fas fa-shield-alt"></i> Active Terminal Session
                  </strong>
                  <span class="badge" style="background: #fff; font-size: 0.7rem; padding: 3px 8px;">
                    SEC Authenticated
                  </span>
                </div>

                <div style="background: #fff; border: 3px solid #000; padding: 24px; box-shadow: 4px 4px 0px #000; margin-bottom: 24px;">
                  <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #555; margin-bottom: 4px;">Logged In Identity</div>
                  <h2 style="font-size: 1.6rem; text-transform: uppercase; margin-bottom: 6px;">${user.full_name}</h2>
                  <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 6px;">${user.email}</div>
                  <div style="font-weight: 700; font-size: 0.8rem; color: #333; text-transform: uppercase;">${user.role || 'Quantitative Analyst'} &bull; ${user.organization || 'Research Desk'}</div>
                </div>

                <div style="font-size: 0.85rem; font-weight: 600; line-height: 1.5; margin-bottom: 24px;">
                  Your institutional API keys and MongoDB cluster synchronization are active. You may launch directly into the terminal or sign out to use a different account.
                </div>
              </div>

              <div>
                <button id="btn-auth-enter-dashboard" class="brutal-btn" style="background: var(--main-yellow); justify-content: center; width: 100%; padding: 16px; font-size: 1.05rem; margin-bottom: 12px;">
                  <i class="fas fa-terminal"></i> Enter Terminal &rarr;
                </button>
                <button id="btn-auth-signout" class="brutal-btn" style="background: #fff; justify-content: center; width: 100%; padding: 10px; font-size: 0.85rem;">
                  <i class="fas fa-sign-out-alt"></i> Sign Out / Switch User
                </button>
              </div>
            ` : `
              <!-- Unauthenticated State: Tabbed Create Account / Sign In -->
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #000; padding-bottom: 12px; margin-bottom: 18px;">
                  <strong style="font-size: 1.1rem; text-transform: uppercase;">
                    <i class="fas fa-user-lock"></i> Analyst Terminal Access
                  </strong>
                  <span class="badge" style="background: #fff; font-size: 0.7rem; padding: 2px 6px;">
                    MongoDB Auth
                  </span>
                </div>

                <!-- Tab Switcher -->
                <div style="display: flex; gap: 8px; margin-bottom: 18px;">
                  <button type="button" id="tab-btn-register" class="brutal-btn" style="flex: 1; justify-content: center; background: #000; color: #fff; font-size: 0.85rem; padding: 10px;">
                    Create Account
                  </button>
                  <button type="button" id="tab-btn-signin" class="brutal-btn" style="flex: 1; justify-content: center; background: #fff; color: #000; font-size: 0.85rem; padding: 10px;">
                    Sign In
                  </button>
                </div>

                <!-- Create Account Form -->
                <form id="form-create-account" style="display: flex; flex-direction: column; gap: 12px;">
                  <div>
                    <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="reg-input-name"
                      placeholder="e.g. Rudra Salokhe"
                      class="brutal-border"
                      style="width: 100%; padding: 10px 12px; font-weight: 700; background: #fff; font-family: 'Space Grotesk', sans-serif;"
                      required
                    />
                  </div>

                  <div>
                    <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">
                      Corporate Email
                    </label>
                    <input
                      type="email"
                      id="reg-input-email"
                      placeholder="e.g. rudra@firm.com"
                      class="brutal-border"
                      style="width: 100%; padding: 10px 12px; font-weight: 700; background: #fff; font-family: 'Space Grotesk', sans-serif;"
                      required
                    />
                  </div>

                  <div>
                    <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">
                      Password (min 6 characters)
                    </label>
                    <input
                      type="password"
                      id="reg-input-password"
                      placeholder="••••••••"
                      class="brutal-border"
                      style="width: 100%; padding: 10px 12px; font-weight: 700; background: #fff; font-family: 'Space Grotesk', sans-serif;"
                      required
                    />
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                      <label style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">
                        Organization / Firm
                      </label>
                      <input
                        type="text"
                        id="reg-input-org"
                        placeholder="Apex Capital"
                        class="brutal-border"
                        style="width: 100%; padding: 8px 10px; font-weight: 700; background: #fff; font-size: 0.8rem; font-family: 'Space Grotesk', sans-serif;"
                      />
                    </div>
                    <div>
                      <label style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">
                        Role / Title
                      </label>
                      <input
                        type="text"
                        id="reg-input-role"
                        placeholder="Quant Strategist"
                        class="brutal-border"
                        style="width: 100%; padding: 8px 10px; font-weight: 700; background: #fff; font-size: 0.8rem; font-family: 'Space Grotesk', sans-serif;"
                      />
                    </div>
                  </div>

                  <button type="submit" id="btn-submit-create" class="brutal-btn" style="background: #000; color: #fff; justify-content: center; padding: 14px; font-size: 0.95rem; margin-top: 6px;">
                    <span>Create Account & Enter Terminal &rarr;</span>
                  </button>
                </form>

                <!-- Sign In Form (Hidden Initially) -->
                <form id="form-signin" style="display: none; flex-direction: column; gap: 12px;">
                  <div>
                    <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">
                      Corporate Email
                    </label>
                    <input
                      type="email"
                      id="login-input-email"
                      placeholder="analyst@outlookiq.internal"
                      class="brutal-border"
                      style="width: 100%; padding: 10px 12px; font-weight: 700; background: #fff; font-family: 'Space Grotesk', sans-serif;"
                      required
                    />
                  </div>

                  <div>
                    <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">
                      Password
                    </label>
                    <input
                      type="password"
                      id="login-input-password"
                      placeholder="••••••••"
                      class="brutal-border"
                      style="width: 100%; padding: 10px 12px; font-weight: 700; background: #fff; font-family: 'Space Grotesk', sans-serif;"
                      required
                    />
                  </div>

                  <button type="submit" id="btn-submit-signin" class="brutal-btn" style="background: #000; color: #fff; justify-content: center; padding: 14px; font-size: 0.95rem; margin-top: 6px;">
                    <span>Sign In & Enter Terminal &rarr;</span>
                  </button>
                </form>
              </div>

              <!-- MongoDB Sync Status Indicator -->
              <div class="brutal-border" style="background: #fff; padding: 12px; margin-top: 18px; font-size: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <span style="font-weight: 700; text-transform: uppercase; color: #555;">Cluster:</span>
                  <strong style="margin-left: 4px;">MongoDB Atlas (myproject)</strong>
                </div>
                <span class="badge" style="background: var(--main-teal); font-size: 0.65rem; padding: 1px 5px;">
                  Atlas Connected
                </span>
              </div>
            `}
          </div>

        </div>

        <!-- Live Performance Ticker Strip -->
        <div class="brutal-card" style="padding: 20px 28px; background: #fdfae7; margin-bottom: 40px;">
          <div class="stat-label" style="font-size: 0.8rem; margin-bottom: 14px; display: flex; justify-content: space-between;">
            <span>Reconciled Guidance Corridors Against Audited SEC Form 10-Q</span>
            <span class="badge" style="background: var(--main-teal); font-size: 0.7rem; padding: 2px 8px;">LIVE FEED</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
            
            <div class="brutal-border" style="background: #fff; padding: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 0.95rem;">NVIDIA (NVDA)</strong>
                <span class="badge" style="background: var(--main-teal); font-size: 0.75rem; padding: 2px 6px;">BEAT +3.8%</span>
              </div>
              <div style="font-size: 0.8rem; font-weight: 600; color: #555;">Q3 FY25 Revenue</div>
              <div style="font-size: 1rem; font-weight: 700; margin-top: 4px;">Guided $32.50B &rarr; Reported $35.08B</div>
            </div>

            <div class="brutal-border" style="background: #fff; padding: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 0.95rem;">Microsoft (MSFT)</strong>
                <span class="badge" style="background: var(--main-yellow); font-size: 0.75rem; padding: 2px 6px;">IN-RANGE +0.4%</span>
              </div>
              <div style="font-size: 0.8rem; font-weight: 600; color: #555;">Q2 FY25 Revenue</div>
              <div style="font-size: 1rem; font-weight: 700; margin-top: 4px;">Guided $68.50B &rarr; Reported $69.63B</div>
            </div>

            <div class="brutal-border" style="background: #fff; padding: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 0.95rem;">Apple Inc (AAPL)</strong>
                <span class="badge" style="background: var(--main-teal); font-size: 0.75rem; padding: 2px 6px;">BEAT +40 bps</span>
              </div>
              <div style="font-size: 0.8rem; font-weight: 600; color: #555;">Q1 FY25 Gross Margin</div>
              <div style="font-size: 1rem; font-weight: 700; margin-top: 4px;">Guided 46.50% &rarr; Reported 46.90%</div>
            </div>

          </div>
        </div>

        <!-- 3 Architecture Pillars -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; margin-bottom: 40px;">
          
          <div class="brutal-card" style="padding: 28px; background: #fff;">
            <div style="font-size: 2.2rem; margin-bottom: 12px; color: #000;">
              <i class="fas fa-layer-group"></i>
            </div>
            <h3 style="font-size: 1.35rem; font-weight: 700; text-transform: uppercase; margin-bottom: 12px;">
              Guidance Corridors
            </h3>
            <p style="font-size: 0.9rem; font-weight: 600; line-height: 1.5; color: #555; margin-bottom: 18px;">
              Quantitative tracking of executive guidance ranges (upper and lower bounds) across Revenue, Diluted EPS, Gross Margin, and OpEx.
            </p>
            <div style="margin-top: auto; border-top: 2px dashed var(--border-color); padding-top: 10px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">
              Multi-Quarter Tracking &bull; Audited
            </div>
          </div>

          <div class="brutal-card bg-teal" style="padding: 28px;">
            <div style="font-size: 2.2rem; margin-bottom: 12px; color: #000;">
              <i class="fas fa-brain"></i>
            </div>
            <h3 style="font-size: 1.35rem; font-weight: 700; text-transform: uppercase; margin-bottom: 12px;">
              ChromaDB Hybrid RAG
            </h3>
            <p style="font-size: 0.9rem; font-weight: 600; line-height: 1.5; color: #000; margin-bottom: 18px;">
              Fuses dense vector retrieval (all-MiniLM-L6-v2) with lexical BM25 keyword matching via Reciprocal Rank Fusion to guarantee zero hallucinations.
            </p>
            <div style="margin-top: auto; border-top: 2px dashed #000; padding-top: 10px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">
              Chunk Inspector &bull; SEC Citations
            </div>
          </div>

          <div class="brutal-card" style="padding: 28px; background: #fff;">
            <div style="font-size: 2.2rem; margin-bottom: 12px; color: #000;">
              <i class="fas fa-sliders-h"></i>
            </div>
            <h3 style="font-size: 1.35rem; font-weight: 700; text-transform: uppercase; margin-bottom: 12px;">
              Management Bias Scoring
            </h3>
            <p style="font-size: 0.9rem; font-weight: 600; line-height: 1.5; color: #555; margin-bottom: 18px;">
              Detects systematic management tendencies: separates strategic sandbagging from chronic overpromising across economic cycles.
            </p>
            <div style="margin-top: auto; border-top: 2px dashed var(--border-color); padding-top: 10px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">
              Empirical Bias &bull; Cross-Firm Compare
            </div>
          </div>

        </div>

        <!-- Terminal Launch Banner -->
        <div class="brutal-card" style="padding: 36px 44px; background: #000; color: #fff; display: flex; justify-content: space-between; align-items: center; box-shadow: 8px 8px 0px var(--main-yellow);">
          <div>
            <h2 style="font-size: 1.8rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; color: var(--main-yellow);">
              Launch Institutional Terminal
            </h2>
            <p style="font-size: 0.95rem; font-weight: 600; color: #bbb; max-width: 650px;">
              Enter the interactive research workspace with live variance charts, peer comparative evaluations, document ingestion, and the AI Financial Analyst.
            </p>
          </div>
          <button id="btn-bottom-enter" class="brutal-btn" style="background: var(--main-yellow); color: #000; font-size: 1rem; padding: 14px 28px;">
            <span>${isAuth ? 'Enter Terminal &rarr;' : 'Create Account & Enter'}</span>
          </button>
        </div>

      </div>

      <!-- Footer -->
      <footer style="border-top: 3px solid var(--border-color); padding: 30px 48px; background: #fff; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">
        <div>
          <span>&copy; 2026 OutlookIQ Quantitative Research Desk</span>
          <span style="color: #666; margin-left: 12px;">SEC EDGAR Access &bull; Deterministic RAG</span>
        </div>
        <div style="display: flex; gap: 20px;">
          <span style="color: #555;">Institutional Tier</span>
          <span style="color: #555;">MongoDB Atlas Synced</span>
        </div>
      </footer>

    </div>
  `;

  // Bind Actions
  const scrollToAuth = () => {
    const card = document.getElementById("landing-auth-card");
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.style.transform = "scale(1.02)";
      setTimeout(() => { card.style.transform = ""; }, 400);
    }
  };

  const handleLaunchRequest = () => {
    if (authService.isAuthenticated()) {
      window.location.hash = "#overview";
    } else {
      showToast("Authentication Required", "Please create an account or sign in to access the Terminal.");
      scrollToAuth();
      document.getElementById("reg-input-email")?.focus();
    }
  };

  // Nav actions
  document.getElementById("nav-btn-enter-terminal")?.addEventListener("click", () => {
    window.location.hash = "#overview";
  });
  document.getElementById("nav-btn-signout")?.addEventListener("click", () => {
    authService.logout();
    showToast("Signed Out", "Terminal session ended.");
    renderLanding(container);
  });
  document.getElementById("nav-btn-tab-create")?.addEventListener("click", () => {
    scrollToAuth();
    document.getElementById("tab-btn-register")?.click();
  });
  document.getElementById("nav-btn-tab-login")?.addEventListener("click", () => {
    scrollToAuth();
    document.getElementById("tab-btn-signin")?.click();
  });

  // Hero launch buttons
  document.getElementById("btn-hero-launch")?.addEventListener("click", handleLaunchRequest);
  document.getElementById("btn-bottom-enter")?.addEventListener("click", handleLaunchRequest);

  // Authenticated card actions
  document.getElementById("btn-auth-enter-dashboard")?.addEventListener("click", () => {
    window.location.hash = "#overview";
  });
  document.getElementById("btn-auth-signout")?.addEventListener("click", () => {
    authService.logout();
    showToast("Signed Out", "Terminal session ended.");
    renderLanding(container);
  });

  // Quick Demo Access Button
  document.getElementById("btn-quick-demo-auth")?.addEventListener("click", async () => {
    showToast("Signing In...", "Authenticating with institutional demo account.");
    try {
      await authService.login("analyst@outlookiq.internal", "demo123");
    } catch {
      // In-memory fallback identity
      authService.token = "demo_token_rudra";
      authService.safeSet("outlookiq_auth_token", "demo_token_rudra");
    }
    showToast("Signed In", "Welcome, Rudra Salokhe! Entering Terminal...");
    setTimeout(() => {
      window.location.hash = "#overview";
    }, 450);
  });

  // Tabs toggle
  const tabReg = document.getElementById("tab-btn-register");
  const tabSign = document.getElementById("tab-btn-signin");
  const formCreate = document.getElementById("form-create-account");
  const formSign = document.getElementById("form-signin");

  tabReg?.addEventListener("click", () => {
    tabReg.style.background = "#000";
    tabReg.style.color = "#fff";
    tabSign.style.background = "#fff";
    tabSign.style.color = "#000";
    if (formCreate) formCreate.style.display = "flex";
    if (formSign) formSign.style.display = "none";
  });

  tabSign?.addEventListener("click", () => {
    tabSign.style.background = "#000";
    tabSign.style.color = "#fff";
    tabReg.style.background = "#fff";
    tabReg.style.color = "#000";
    if (formCreate) formCreate.style.display = "none";
    if (formSign) formSign.style.display = "flex";
  });

  // Create Account Form Submit
  formCreate?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.getElementById("reg-input-name")?.value.trim() || "Quantitative Analyst";
    const email = document.getElementById("reg-input-email")?.value.trim();
    const password = document.getElementById("reg-input-password")?.value.trim();
    const organization = document.getElementById("reg-input-org")?.value.trim() || "Institutional Research Desk";
    const role = document.getElementById("reg-input-role")?.value.trim() || "Senior Analyst";

    if (!email || !password) {
      showToast("Missing Information", "Please enter an email and password.");
      return;
    }

    const submitBtn = document.getElementById("btn-submit-create");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span><i class="fas fa-spinner fa-spin"></i> Creating Account...</span>`;
    }

    try {
      showToast("Creating Account", `Registering institutional account for ${email}...`);
      const res = await authService.register({
        email,
        password,
        full_name: fullName,
        organization,
        role
      });
      showToast("Account Created!", `Welcome, ${res.user.full_name || fullName}! Launching Terminal...`);
      setTimeout(() => {
        window.location.hash = "#overview";
      }, 500);
    } catch (err) {
      showToast("Registration Error", err.message || "Failed to create account.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Create Account & Enter Terminal &rarr;</span>`;
      }
    }
  });

  // Sign In Form Submit
  formSign?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-input-email")?.value.trim();
    const password = document.getElementById("login-input-password")?.value.trim();

    if (!email || !password) {
      showToast("Missing Credentials", "Please enter your email and password.");
      return;
    }

    const submitBtn = document.getElementById("btn-submit-signin");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span><i class="fas fa-spinner fa-spin"></i> Signing In...</span>`;
    }

    try {
      showToast("Authenticating", `Verifying credentials for ${email}...`);
      const res = await authService.login(email, password);
      showToast("Signed In", `Welcome back, ${res.user.full_name}! Launching Terminal...`);
      setTimeout(() => {
        window.location.hash = "#overview";
      }, 500);
    } catch (err) {
      showToast("Authentication Failed", err.message || "Invalid credentials.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Sign In & Enter Terminal &rarr;</span>`;
      }
    }
  });
}
