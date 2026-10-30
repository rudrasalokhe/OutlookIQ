/**
 * OutlookIQ Reusable UI Components — Neo-Brutalist Design
 * Drawers, Modals, Toasts, Badges, and Watchlist management.
 */

import { evaluatePromise, formatValue, formatPct } from "./calculations.js";
import { MOCK_COMPANIES, MOCK_NOTIFICATIONS } from "./mockData.js";

/**
 * Toast Notification System (Neo-Brutalist)
 */
export function showToast(title, message = "", type = "info", duration = 3500) {
  let container = document.getElementById("toast-container");
  if (!container && typeof document !== "undefined" && document.body) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `brutal-card bg-yellow brutal-border brutal-shadow`;
  toast.style.padding = "12px 16px";
  toast.style.width = "320px";
  toast.style.maxWidth = "90vw";
  toast.style.display = "flex";
  toast.style.alignItems = "flex-start";
  toast.style.gap = "10px";

  const msgText = (typeof message === "string" && message !== "undefined" && message.trim() !== "") ? message.trim() : "";

  toast.innerHTML = `
    <div style="flex: 1;">
      <div style="font-weight: 700; text-transform: uppercase; font-size: 0.8rem; line-height: 1.2;">${title}</div>
      ${msgText ? `<div style="font-size: 0.75rem; font-weight: 600; color: #171717; margin-top: 4px; line-height: 1.3;">${msgText}</div>` : ""}
    </div>
    <button class="toast-close" style="background: none; border: none; font-size: 1.1rem; font-weight: 700; cursor: pointer; padding: 0 4px; line-height: 1;">&times;</button>
  `;

  toast.querySelector(".toast-close")?.addEventListener("click", () => {
    toast.remove();
  });

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, duration);
}

/**
 * Outcome Badge Renderer (Neo-Brutalist)
 */
export function renderOutcomeBadge(outcome) {
  const norm = (outcome || "").toLowerCase();
  if (norm === "exceeded") {
    return `<span class="stat-trend bg-yellow" style="margin: 0;">↗ EXCEEDED</span>`;
  }
  if (norm === "met") {
    return `<span class="stat-trend" style="background: var(--main-teal); margin: 0;">● MET</span>`;
  }
  if (norm === "missed") {
    return `<span class="stat-trend" style="background: var(--main-pink); margin: 0;">↘ MISSED</span>`;
  }
  if (norm === "pending") {
    return `<span class="stat-trend" style="background: #e5e5e5; margin: 0;">◌ PENDING</span>`;
  }
  return `<span class="stat-trend" style="background: #e5e5e5; margin: 0;">UNVERIFIED</span>`;
}

/**
 * Evidence Drawer Singleton (Neo-Brutalist)
 */
export class EvidenceDrawer {
  constructor() {
    this.drawerEl = null;
    this.overlayEl = null;
    this.init();
  }

  init() {
    if (typeof document === "undefined") return;
    let drawer = document.getElementById("evidence-drawer");
    let overlay = document.getElementById("evidence-drawer-backdrop");

    if (!drawer && document.body) {
      drawer = document.createElement("div");
      drawer.id = "evidence-drawer";
      drawer.className = "evidence-drawer";
      document.body.appendChild(drawer);
    }
    if (!overlay && document.body) {
      overlay = document.createElement("div");
      overlay.id = "evidence-drawer-backdrop";
      overlay.className = "evidence-drawer-backdrop";
      document.body.appendChild(overlay);
    }

    this.drawerEl = drawer;
    this.overlayEl = overlay;

    if (overlay && !overlay._hasCloseListener) {
      overlay._hasCloseListener = true;
      overlay.addEventListener("click", () => this.close());
    }
    if (!this._hasEscListener) {
      this._hasEscListener = true;
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.isOpen()) this.close();
      });
    }
  }

  ensureInit() {
    if (!this.drawerEl || !this.overlayEl) {
      this.init();
    }
  }

  isOpen() {
    this.ensureInit();
    return this.drawerEl ? this.drawerEl.classList.contains("open") : false;
  }

  close() {
    this.ensureInit();
    if (this.drawerEl) this.drawerEl.classList.remove("open");
    if (this.overlayEl) this.overlayEl.classList.remove("open");
  }

  open(promise) {
    if (!promise) return;
    this.ensureInit();
    const ev = evaluatePromise(promise);
    const rangeStr = `${formatValue(promise.guidanceLower, promise.unit)} – ${formatValue(promise.guidanceUpper, promise.unit)}`;

    this.drawerEl.innerHTML = `
      <!-- Header -->
      <div style="background: var(--main-yellow); padding: 20px; border-bottom: 3px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div class="badge" style="background: #000; color: #fff; margin-bottom: 4px;">AUDITED EVIDENCE</div>
          <h2 style="font-size: 1.15rem; font-weight: 700; text-transform: uppercase; margin: 0;">
            ${promise.companyName} (${promise.ticker}) · ${promise.targetQuarter}
          </h2>
        </div>
        <button id="drawer-close" class="brutal-btn" style="padding: 6px 10px;">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Content Area -->
      <div style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px;">
        <!-- Banner -->
        <div class="brutal-card" style="padding: 16px; flex-direction: row; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 1.1rem; font-weight: 700; text-transform: uppercase;">${promise.metric}</div>
            <div style="font-size: 0.8rem; font-weight: 600; color: #666;">${promise.targetQuarter} (${promise.fiscalYear})</div>
          </div>
          <div>${renderOutcomeBadge(ev.outcome)}</div>
        </div>

        <!-- Section 1: Management's Original Forecast -->
        <div class="brutal-card">
          <div class="stat-label">01. Management Forward Guidance</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
            <div>
              <span class="stat-label" style="font-size: 0.7rem; border: none; margin: 0; padding: 0;">Announced</span>
              <div style="font-weight: 700; font-size: 0.95rem;">${promise.announcementDate}</div>
            </div>
            <div>
              <span class="stat-label" style="font-size: 0.7rem; border: none; margin: 0; padding: 0;">Period</span>
              <div style="font-weight: 700; font-size: 0.95rem; text-transform: uppercase;">${promise.targetQuarter}</div>
            </div>
            <div>
              <span class="stat-label" style="font-size: 0.7rem; border: none; margin: 0; padding: 0;">Corridor</span>
              <div style="font-weight: 700; font-size: 0.95rem;">${rangeStr}</div>
            </div>
            <div>
              <span class="stat-label" style="font-size: 0.7rem; border: none; margin: 0; padding: 0;">Midpoint</span>
              <div style="font-weight: 700; font-size: 0.95rem;">${formatValue(ev.midpoint, promise.unit)}</div>
            </div>
          </div>

          <div class="brutal-border" style="background: #fdfae7; padding: 12px; font-size: 0.85rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-weight: 700; font-size: 0.75rem; text-transform: uppercase;">
              <span>${promise.speaker || "Corporate Officer"}</span>
              <span style="color: #666;">${promise.sourceDocTitle}</span>
            </div>
            <blockquote style="font-style: italic; line-height: 1.4; color: #171717;">"${promise.transcriptExcerpt}"</blockquote>
          </div>
        </div>

        <!-- Section 2: Actual Financial Results -->
        <div class="brutal-card">
          <div class="stat-label">02. Reported Performance</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <span class="stat-label" style="font-size: 0.7rem; border: none; margin: 0; padding: 0;">Reported Actual</span>
              <div style="font-size: 1.2rem; font-weight: 700;">
                ${promise.actual !== null ? formatValue(promise.actual, promise.unit) : '<span class="badge" style="background: #e5e5e5;">Pending</span>'}
              </div>
            </div>
            <div>
              <span class="stat-label" style="font-size: 0.7rem; border: none; margin: 0; padding: 0;">Filing Date</span>
              <div style="font-weight: 700; font-size: 0.95rem;">${promise.reportDate || "Scheduled"}</div>
            </div>
            <div>
              <span class="stat-label" style="font-size: 0.7rem; border: none; margin: 0; padding: 0;">Audit Document</span>
              <div style="font-weight: 700; font-size: 0.85rem;">${promise.actualSourceDocTitle || "Form 10-Q"}</div>
            </div>
            <div>
              <span class="stat-label" style="font-size: 0.7rem; border: none; margin: 0; padding: 0;">Status</span>
              <div class="badge" style="background: var(--main-teal); padding: 2px 6px;">VERIFIED</div>
            </div>
          </div>
        </div>

        <!-- Section 3: Performance Evaluation -->
        <div class="brutal-card bg-yellow">
          <div class="stat-label">03. Deterministic Evaluation</div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; text-align: center; margin-bottom: 12px;" class="brutal-border" style="background: #fff; padding: 10px;">
            <div>
              <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">Midpoint</div>
              <div style="font-weight: 700;">${formatValue(ev.midpoint, promise.unit)}</div>
            </div>
            <div>
              <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">Actual</div>
              <div style="font-weight: 700;">${promise.actual !== null ? formatValue(promise.actual, promise.unit) : "—"}</div>
            </div>
            <div>
              <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">Abs Diff</div>
              <div style="font-weight: 700;">${ev.diffAbs !== null ? formatValue(ev.diffAbs, promise.unit) : "—"}</div>
            </div>
            <div>
              <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">Variance</div>
              <div style="font-weight: 700;">${ev.diffPct !== null ? formatPct(ev.diffPct) : "—"}</div>
            </div>
          </div>
          <p style="font-size: 0.8rem; font-weight: 600; line-height: 1.4;">
            ${ev.explanation}
          </p>
        </div>

        <!-- Section 4: Sources & Citations -->
        <div class="brutal-card">
          <div class="stat-label">04. Source Citation</div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; font-size: 0.85rem;">${promise.sourceDocTitle}</div>
              <div style="font-size: 0.75rem; font-weight: 600; color: #666;">${promise.sourceDocType} · ${promise.announcementDate}</div>
            </div>
            <button id="btn-copy-citation" class="brutal-btn" style="padding: 6px 12px; font-size: 0.75rem; background: var(--main-yellow);">
              <i class="fas fa-copy"></i> Copy Citation
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("drawer-close").addEventListener("click", () => this.close());

    document.getElementById("btn-copy-citation")?.addEventListener("click", () => {
      const citation = `${promise.companyName} (${promise.ticker}), ${promise.targetQuarter} Guidance: "${promise.transcriptExcerpt}" — ${promise.sourceDocTitle} (${promise.announcementDate}). Evaluated by OutlookIQ.`;
      navigator.clipboard.writeText(citation).then(() => {
        showToast("Citation Copied", "Standard financial citation copied to clipboard.");
      });
    });

    this.drawerEl.classList.add("open");
    this.overlayEl.classList.add("open");
  }
}

export const evidenceDrawer = new EvidenceDrawer();

/**
 * Company Profile Modal (Neo-Brutalist)
 */
export function openCompanyProfileModal(company, promises) {
  let modal = document.getElementById("company-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "company-modal";
    modal.className = "evidence-drawer-backdrop";
    modal.style.display = "flex";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.padding = "24px";
    document.body.appendChild(modal);
  }

  const compPromises = promises.filter(p => p.companyId === company.id || p.ticker === company.ticker);
  const isWatchlisted = isCompanyWatchlisted(company.ticker);

  modal.innerHTML = `
    <div class="brutal-card" style="width: 100%; max-width: 680px; max-height: 90vh; overflow-y: auto; background: #fff; padding: 24px;">
      <!-- Modal Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid var(--border-color); padding-bottom: 14px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="brutal-border bg-yellow" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;">
            ${company.monogram || company.ticker.slice(0, 2)}
          </div>
          <div>
            <span class="badge" style="font-size: 0.7rem; padding: 2px 6px;">${company.ticker} · ${company.sector}</span>
            <h2 style="font-size: 1.35rem; font-weight: 700; text-transform: uppercase;">${company.name}</h2>
          </div>
        </div>
        <button id="modal-close-btn" class="brutal-btn" style="padding: 4px 8px;">&times;</button>
      </div>

      <!-- Tab Buttons -->
      <div style="display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">
        <button class="brutal-btn tab-btn active" data-tab="tab-overview" style="background: var(--main-yellow);">Overview</button>
        <button class="brutal-btn tab-btn" data-tab="tab-promises">Guidance History (${compPromises.length})</button>
        <button class="brutal-btn tab-btn" data-tab="tab-management">Executive Desk</button>
      </div>

      <!-- Tab Content Area -->
      <div style="margin-bottom: 20px;">
        <div class="modal-tab-content block" id="tab-overview">
          <div class="grid-4" style="margin-bottom: 16px;">
            <div class="brutal-card" style="padding: 12px;">
              <span class="stat-label" style="font-size: 0.7rem; margin-bottom: 2px;">Market Cap</span>
              <strong style="font-size: 1rem;">${company.marketCap}</strong>
            </div>
            <div class="brutal-card" style="padding: 12px;">
              <span class="stat-label" style="font-size: 0.7rem; margin-bottom: 2px;">P/E Ratio</span>
              <strong style="font-size: 1rem;">${company.peRatio}</strong>
            </div>
            <div class="brutal-card bg-yellow" style="padding: 12px;">
              <span class="stat-label" style="font-size: 0.7rem; margin-bottom: 2px;">Adherence</span>
              <strong style="font-size: 1rem;">${company.guidanceCoverage}</strong>
            </div>
            <div class="brutal-card" style="padding: 12px;">
              <span class="stat-label" style="font-size: 0.7rem; margin-bottom: 2px;">Latest</span>
              <strong style="font-size: 1rem;">${company.lastReportedQuarter}</strong>
            </div>
          </div>
          <p style="font-size: 0.85rem; font-weight: 600; line-height: 1.5; color: #333; margin-bottom: 14px;">${company.description}</p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${(company.tags || []).map(t => `<span class="badge" style="background: #fff;">${t}</span>`).join("")}
          </div>
        </div>

        <div class="modal-tab-content" id="tab-promises" style="display: none; overflow-x: auto;">
          <table class="brutal-table">
            <thead>
              <tr>
                <th>Quarter</th>
                <th>Metric</th>
                <th>Corridor</th>
                <th>Actual</th>
                <th style="text-align: right;">Outcome</th>
              </tr>
            </thead>
            <tbody>
              ${compPromises.map(p => {
                const ev = evaluatePromise(p);
                return `
                  <tr>
                    <td style="font-weight: 700; text-transform: uppercase;">${p.targetQuarter}</td>
                    <td style="font-weight: 600;">${p.metric}</td>
                    <td style="font-weight: 600;">${formatValue(p.guidanceLower, p.unit)} - ${formatValue(p.guidanceUpper, p.unit)}</td>
                    <td style="font-weight: 700;">${p.actual !== null ? formatValue(p.actual, p.unit) : "Pending"}</td>
                    <td style="text-align: right;">${renderOutcomeBadge(ev.outcome)}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>

        <div class="modal-tab-content" id="tab-management" style="display: none;">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div class="brutal-card">
              <span class="stat-label">Chief Executive Officer</span>
              <h4 style="font-size: 1.15rem; font-weight: 700; text-transform: uppercase;">${company.ceo}</h4>
              <p style="font-size: 0.8rem; font-weight: 600; color: #555; margin-top: 4px;">Directs institutional strategy and strategic guidance commentary.</p>
            </div>
            <div class="brutal-card">
              <span class="stat-label">Chief Financial Officer</span>
              <h4 style="font-size: 1.15rem; font-weight: 700; text-transform: uppercase;">${company.cfo}</h4>
              <p style="font-size: 0.8rem; font-weight: 600; color: #555; margin-top: 4px;">Provides explicit quarterly financial corridors, gross margins, and expense outlooks.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid var(--border-color); padding-top: 14px;">
        <button id="btn-toggle-watchlist" class="brutal-btn" style="${isWatchlisted ? "background: var(--main-pink);" : "background: #fff;"}">
          ${isWatchlisted ? "★ In Watchlist" : "☆ Add to Watchlist"}
        </button>
        <div style="display: flex; gap: 8px;">
          <button id="btn-compare-from-modal" class="brutal-btn">Compare</button>
          <button id="btn-view-tracker" class="brutal-btn" style="background: var(--main-yellow);">Inspect Tracker</button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("open");

  modal.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      modal.querySelectorAll(".tab-btn").forEach(b => {
        b.style.background = "#fff";
      });
      modal.querySelectorAll(".modal-tab-content").forEach(c => c.style.display = "none");
      btn.style.background = "var(--main-yellow)";
      modal.querySelector(`#${btn.dataset.tab}`).style.display = "block";
    });
  });

  const watchlistBtn = modal.querySelector("#btn-toggle-watchlist");
  watchlistBtn.addEventListener("click", () => {
    const updated = toggleWatchlist(company.ticker);
    watchlistBtn.textContent = updated ? "★ In Watchlist" : "☆ Add to Watchlist";
    watchlistBtn.style.background = updated ? "var(--main-pink)" : "#fff";
    showToast(
      updated ? "Added to Watchlist" : "Removed from Watchlist",
      `${company.name} (${company.ticker}) saved in watchlist.`
    );
  });

  modal.querySelector("#btn-compare-from-modal").addEventListener("click", () => {
    modal.classList.remove("open");
    window.location.hash = `#comparison?compA=${company.ticker}`;
  });

  modal.querySelector("#btn-view-tracker").addEventListener("click", () => {
    modal.classList.remove("open");
    window.location.hash = `#promises?company=${company.ticker}`;
  });

  modal.querySelector("#modal-close-btn").addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });
}

/**
 * Watchlist Local Storage Helpers
 */
export function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem("outlookiq_watchlist") || "[]");
  } catch {
    return [];
  }
}

export function isCompanyWatchlisted(ticker) {
  const list = getWatchlist();
  return list.includes(ticker);
}

export function toggleWatchlist(ticker) {
  let list = getWatchlist();
  if (list.includes(ticker)) {
    list = list.filter(t => t !== ticker);
    localStorage.setItem("outlookiq_watchlist", JSON.stringify(list));
    return false;
  } else {
    list.push(ticker);
    localStorage.setItem("outlookiq_watchlist", JSON.stringify(list));
    return true;
  }
}
