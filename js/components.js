/**
 * OutlookIQ Reusable UI Components — Intelly Style
 * Drawers, Modals, Toasts, Badges, and Watchlist management.
 */

import { evaluatePromise, formatValue, formatPct } from "./calculations.js";
import { MOCK_COMPANIES, MOCK_NOTIFICATIONS } from "./mockData.js";

/**
 * Toast Notification System (Intelly Style)
 */
export function showToast(title, message, type = "info", duration = 3500) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type} pointer-events-auto min-w-[300px] max-w-[400px] bg-sidebarDark text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3 transition-all duration-200 border border-white/10`;

  const iconClassMap = {
    success: "fas fa-check text-pastelGreen",
    info: "fas fa-info-circle text-pastelBlue",
    warning: "fas fa-exclamation-triangle text-pastelYellow",
    danger: "fas fa-times text-pastelRed"
  };

  toast.innerHTML = `
    <div class="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
      <i class="${iconClassMap[type] || "fas fa-info"} text-xs"></i>
    </div>
    <div class="flex-1">
      <div class="text-xs font-bold text-white mb-0.5">${title}</div>
      <div class="text-[11px] text-gray-300 leading-normal">${message}</div>
    </div>
    <button class="toast-close text-gray-400 hover:text-white text-xs cursor-pointer p-1 focus:outline-none">&times;</button>
  `;

  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.remove();
  });

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, duration);
}

/**
 * Outcome Badge Renderer (Intelly Pastel Badges)
 */
export function renderOutcomeBadge(outcome) {
  const norm = (outcome || "").toLowerCase();
  if (norm === "exceeded") {
    return `<span class="bg-[#e6f4ea] text-[#137333] text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block border border-green-200">Exceeded</span>`;
  }
  if (norm === "met") {
    return `<span class="bg-[#e8f0fe] text-[#1a73e8] text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block border border-blue-200">Met</span>`;
  }
  if (norm === "missed") {
    return `<span class="bg-[#fce8e6] text-[#c5221f] text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block border border-red-200">Missed</span>`;
  }
  if (norm === "pending") {
    return `<span class="bg-[#fef7e0] text-[#b06000] text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block border border-yellow-200">Pending</span>`;
  }
  return `<span class="bg-gray-100 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded-full inline-block">Unverifiable</span>`;
}

/**
 * Evidence Drawer Singleton (CRM Style Rounded Canvas)
 */
export class EvidenceDrawer {
  constructor() {
    this.drawerEl = null;
    this.overlayEl = null;
    this.init();
  }

  init() {
    let drawer = document.getElementById("evidence-drawer");
    let overlay = document.getElementById("drawer-overlay");

    if (!drawer) {
      drawer = document.createElement("div");
      drawer.id = "evidence-drawer";
      drawer.className = "evidence-drawer fixed top-0 right-0 bottom-0 w-[560px] max-w-[92vw] bg-white text-textMain rounded-l-[2rem] shadow-2xl z-50 flex flex-col transform translate-x-full transition-transform duration-300 ease-out border-l border-borderSubtle";
      document.body.appendChild(drawer);
    }
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "drawer-overlay";
      overlay.className = "drawer-overlay fixed inset-0 bg-black/40 backdrop-blur-sm z-40 opacity-0 pointer-events-none transition-opacity duration-200";
      document.body.appendChild(overlay);
    }

    this.drawerEl = drawer;
    this.overlayEl = overlay;

    this.overlayEl.addEventListener("click", () => this.close());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen()) this.close();
    });
  }

  isOpen() {
    return this.drawerEl.classList.contains("translate-x-0");
  }

  open(promise) {
    if (!promise) return;
    const ev = evaluatePromise(promise);
    const rangeStr = `${formatValue(promise.guidanceLower, promise.unit)} – ${formatValue(promise.guidanceUpper, promise.unit)}`;

    this.drawerEl.innerHTML = `
      <!-- Header -->
      <div class="h-20 px-8 border-b border-borderSubtle flex items-center justify-between bg-cardBase shrink-0 rounded-tl-[2rem]">
        <div>
          <div class="text-[10px] font-bold text-darkAccent uppercase tracking-wider flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-brandYellow"></span> Guidance Evidence & Audit Trail
          </div>
          <h2 class="text-lg font-bold text-textMain tracking-tight">${promise.companyName} (${promise.ticker}) · ${promise.targetQuarter}</h2>
        </div>
        <button id="drawer-close" class="w-8 h-8 rounded-full bg-white border border-borderSubtle flex items-center justify-center text-textMuted hover:text-textMain text-sm transition-colors focus:outline-none">&times;</button>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-8 space-y-6">
        <!-- Banner -->
        <div class="bg-cardBase rounded-2xl p-4 flex items-center justify-between border border-borderSubtle">
          <div>
            <span class="text-sm font-bold text-textMain block">${promise.metric}</span>
            <span class="text-xs text-textMuted">${promise.targetQuarter} (${promise.fiscalYear})</span>
          </div>
          <div>${renderOutcomeBadge(ev.outcome)}</div>
        </div>

        <!-- Section 1: Management's Original Forecast -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="w-6 h-6 rounded-full bg-darkAccent text-white text-[11px] font-bold flex items-center justify-center">1</span>
            <h3 class="text-xs font-bold text-textMain uppercase tracking-wider">Management's Original Forecast</h3>
          </div>
          <div class="bg-white rounded-2xl p-5 border border-borderSubtle soft-shadow space-y-3">
            <div class="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span class="text-[10px] text-textMuted uppercase font-semibold block">Announced Date</span>
                <span class="font-mono text-textMain font-medium">${promise.announcementDate}</span>
              </div>
              <div>
                <span class="text-[10px] text-textMuted uppercase font-semibold block">Target Period</span>
                <span class="text-textMain font-medium">${promise.targetQuarter}</span>
              </div>
              <div>
                <span class="text-[10px] text-textMuted uppercase font-semibold block">Guidance Corridor</span>
                <span class="font-mono text-green-700 font-bold">${rangeStr}</span>
              </div>
              <div>
                <span class="text-[10px] text-textMuted uppercase font-semibold block">Midpoint</span>
                <span class="font-mono text-textMain font-bold">${formatValue(ev.midpoint, promise.unit)}</span>
              </div>
            </div>

            <div class="bg-bgLight rounded-xl p-3.5 text-xs">
              <div class="flex justify-between mb-1.5 text-[11px]">
                <span class="font-bold text-textMain">${promise.speaker || "Corporate Officer"}</span>
                <span class="text-textMuted">${promise.sourceDocTitle}</span>
              </div>
              <blockquote class="italic text-gray-700 leading-relaxed">"${promise.transcriptExcerpt}"</blockquote>
            </div>
          </div>
        </div>

        <!-- Section 2: Actual Financial Results -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="w-6 h-6 rounded-full bg-sidebarDark text-white text-[11px] font-bold flex items-center justify-center">2</span>
            <h3 class="text-xs font-bold text-textMain uppercase tracking-wider">Actual Financial Results</h3>
          </div>
          <div class="bg-cardWhite rounded-2xl p-5 border border-black/5 intelly-shadow">
            <div class="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span class="text-[10px] text-textMuted uppercase font-semibold block">Reported Actual</span>
                <span class="font-mono text-base font-bold ${promise.actual !== null ? "text-green-700" : "text-yellow-600"}">
                  ${promise.actual !== null ? formatValue(promise.actual, promise.unit) : "Pending Release"}
                </span>
              </div>
              <div>
                <span class="text-[10px] text-textMuted uppercase font-semibold block">Filing Date</span>
                <span class="font-mono text-textMain font-medium">${promise.reportDate || "Scheduled"}</span>
              </div>
              <div>
                <span class="text-[10px] text-textMuted uppercase font-semibold block">Audit Source</span>
                <span class="text-textMain">${promise.actualSourceDocTitle || "Form 10-Q (Upcoming)"}</span>
              </div>
              <div>
                <span class="text-[10px] text-textMuted uppercase font-semibold block">Verification</span>
                <span class="text-green-700 font-semibold">${promise.verificationState || "Verified"}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Performance Evaluation -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="w-6 h-6 rounded-full bg-sidebarDark text-white text-[11px] font-bold flex items-center justify-center">3</span>
            <h3 class="text-xs font-bold text-textMain uppercase tracking-wider">Deterministic Performance Evaluation</h3>
          </div>
          <div class="bg-cardWhite rounded-2xl p-5 border border-black/5 intelly-shadow">
            <div class="flex items-center justify-between bg-bgLight p-3.5 rounded-xl mb-3 text-center text-xs">
              <div>
                <div class="text-[10px] text-textMuted uppercase font-semibold">Midpoint</div>
                <div class="font-mono font-bold text-textMain">${formatValue(ev.midpoint, promise.unit)}</div>
              </div>
              <div class="text-textMuted font-bold">vs</div>
              <div>
                <div class="text-[10px] text-textMuted uppercase font-semibold">Actual</div>
                <div class="font-mono font-bold text-textMain">${promise.actual !== null ? formatValue(promise.actual, promise.unit) : "—"}</div>
              </div>
              <div class="text-textMuted font-bold">=</div>
              <div>
                <div class="text-[10px] text-textMuted uppercase font-semibold">Abs Diff</div>
                <div class="font-mono font-bold text-textMain">${ev.diffAbs !== null ? formatValue(ev.diffAbs, promise.unit) : "—"}</div>
              </div>
              <div class="bg-cardWhite px-2.5 py-1 rounded-lg border border-black/5 intelly-shadow">
                <div class="text-[10px] text-textMuted uppercase font-semibold">Deviation</div>
                <div class="font-mono font-bold text-green-700">${ev.diffPct !== null ? formatPct(ev.diffPct) : "—"}</div>
              </div>
            </div>

            <p class="text-xs text-textMuted leading-relaxed">
              <strong class="text-textMain">Calculation:</strong> ${ev.explanation}
            </p>
            ${promise.notes ? `<p class="text-xs text-gray-500 italic mt-2.5 pt-2 border-t border-black/5"><strong>Context:</strong> ${promise.notes}</p>` : ""}
          </div>
        </div>

        <!-- Section 4: Sources & Citations -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="w-6 h-6 rounded-full bg-sidebarDark text-white text-[11px] font-bold flex items-center justify-center">4</span>
            <h3 class="text-xs font-bold text-textMain uppercase tracking-wider">Source Verification & Citations</h3>
          </div>
          <div class="bg-cardWhite rounded-2xl p-5 border border-black/5 intelly-shadow space-y-3">
            <div class="bg-pastelYellow text-yellow-900 rounded-xl p-3 text-xs">
              <strong>Illustrative Data — No External Source</strong>
              <p class="text-[11px] text-yellow-800 mt-0.5">Part of OutlookIQ's structured demonstration suite. Outbound web navigation is disabled.</p>
            </div>

            <div class="flex justify-between items-center pt-1">
              <div>
                <div class="text-xs font-semibold text-textMain">${promise.sourceDocTitle}</div>
                <div class="text-[10px] text-textMuted">${promise.sourceDocType} · ${promise.announcementDate}</div>
              </div>
              <button id="btn-copy-citation" class="px-3.5 py-1.5 bg-sidebarDark text-white rounded-full text-xs font-semibold hover:bg-black transition-colors">
                <i class="fas fa-copy mr-1 text-[10px]"></i> Copy Citation
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("drawer-close").addEventListener("click", () => this.close());

    document.getElementById("btn-copy-citation")?.addEventListener("click", () => {
      const citation = `${promise.companyName} (${promise.ticker}), ${promise.targetQuarter} Guidance: "${promise.transcriptExcerpt}" — ${promise.sourceDocTitle} (${promise.announcementDate}). Evaluated by OutlookIQ.`;
      navigator.clipboard.writeText(citation).then(() => {
        showToast("Citation Copied", "Standard financial citation copied to clipboard.", "success");
      });
    });

    this.drawerEl.classList.remove("translate-x-full");
    this.drawerEl.classList.add("translate-x-0");
    this.overlayEl.classList.remove("opacity-0", "pointer-events-none");
    this.overlayEl.classList.add("opacity-100", "pointer-events-auto");
  }

  close() {
    this.drawerEl.classList.remove("translate-x-0");
    this.drawerEl.classList.add("translate-x-full");
    this.overlayEl.classList.remove("opacity-100", "pointer-events-auto");
    this.overlayEl.classList.add("opacity-0", "pointer-events-none");
  }
}

export const evidenceDrawer = new EvidenceDrawer();

/**
 * Company Profile Modal (Intelly Rounded-3xl Style)
 */
export function openCompanyProfileModal(company, promises) {
  let modal = document.getElementById("company-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "company-modal";
    modal.className = "fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-200";
    document.body.appendChild(modal);
  }

  const compPromises = promises.filter(p => p.companyId === company.id || p.ticker === company.ticker);
  const isWatchlisted = isCompanyWatchlisted(company.ticker);

  modal.innerHTML = `
    <div class="bg-cardWhite rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-black/5">
      <!-- Modal Header -->
      <div class="p-6 border-b border-black/5 flex items-center justify-between bg-cardWhite">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm bg-pastelGreen text-green-800">
            ${company.monogram}
          </div>
          <div>
            <div class="text-[10px] text-textMuted font-mono uppercase">${company.ticker} · ${company.sector}</div>
            <h2 class="text-lg font-bold text-textMain">${company.name}</h2>
          </div>
        </div>
        <button id="modal-close-btn" class="w-8 h-8 rounded-full bg-bgLight flex items-center justify-center text-textMuted hover:text-textMain text-sm transition-colors focus:outline-none">&times;</button>
      </div>

      <!-- Tab Buttons -->
      <div class="flex border-b border-black/5 px-6 bg-bgLight/40 text-xs font-semibold gap-2 pt-2">
        <button class="tab-btn py-2.5 px-4 text-textMain bg-cardWhite rounded-t-xl border-t border-x border-black/5 focus:outline-none font-bold" data-tab="tab-overview">Overview</button>
        <button class="tab-btn py-2.5 px-4 text-textMuted hover:text-textMain focus:outline-none" data-tab="tab-promises">Guidance History (${compPromises.length})</button>
        <button class="tab-btn py-2.5 px-4 text-textMuted hover:text-textMain focus:outline-none" data-tab="tab-management">Executive Leadership</button>
      </div>

      <!-- Tab Content Area -->
      <div class="p-6 flex-1 overflow-y-auto">
        <div class="modal-tab-content block" id="tab-overview">
          <div class="grid grid-cols-4 gap-3 bg-bgLight p-4 rounded-2xl mb-4 text-center">
            <div><span class="text-[10px] text-textMuted uppercase font-semibold block">Market Cap</span><span class="font-mono text-sm text-textMain font-bold">${company.marketCap}</span></div>
            <div><span class="text-[10px] text-textMuted uppercase font-semibold block">P/E Ratio</span><span class="font-mono text-sm text-textMain font-bold">${company.peRatio}</span></div>
            <div><span class="text-[10px] text-textMuted uppercase font-semibold block">Coverage</span><span class="font-mono text-sm text-green-700 font-bold">${company.guidanceCoverage}</span></div>
            <div><span class="text-[10px] text-textMuted uppercase font-semibold block">Latest Quarter</span><span class="text-sm text-textMain font-bold">${company.lastReportedQuarter}</span></div>
          </div>
          <p class="text-sm text-gray-700 leading-relaxed mb-4">${company.description}</p>
          <div class="flex flex-wrap gap-2">
            ${(company.tags || []).map(t => `<span class="bg-bgLight px-3 py-1 rounded-full text-xs font-medium text-textMain">${t}</span>`).join("")}
          </div>
        </div>

        <div class="modal-tab-content hidden" id="tab-promises">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-textMuted uppercase text-[10px] border-b border-black/5 pb-2">
                <th class="py-2">Quarter</th>
                <th class="py-2">Metric</th>
                <th class="py-2">Guidance</th>
                <th class="py-2">Actual</th>
                <th class="py-2 text-right">Outcome</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-black/5 text-textMain">
              ${compPromises.map(p => {
                const ev = evaluatePromise(p);
                return `
                  <tr>
                    <td class="py-3 font-bold">${p.targetQuarter}</td>
                    <td class="py-3 text-textMuted">${p.metric}</td>
                    <td class="py-3 font-mono text-textMuted">${formatValue(p.guidanceLower, p.unit)} - ${formatValue(p.guidanceUpper, p.unit)}</td>
                    <td class="py-3 font-mono font-bold">${p.actual !== null ? formatValue(p.actual, p.unit) : "Pending"}</td>
                    <td class="py-3 text-right">${renderOutcomeBadge(ev.outcome)}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>

        <div class="modal-tab-content hidden" id="tab-management">
          <div class="space-y-3">
            <div class="bg-bgLight p-4 rounded-2xl">
              <span class="text-[10px] text-blue-700 uppercase font-bold">Chief Executive Officer</span>
              <h4 class="text-base font-bold text-textMain mt-0.5">${company.ceo}</h4>
              <p class="text-xs text-textMuted mt-1">Directs long-term product strategy and provides high-level revenue framing.</p>
            </div>
            <div class="bg-bgLight p-4 rounded-2xl">
              <span class="text-[10px] text-blue-700 uppercase font-bold">Chief Financial Officer</span>
              <h4 class="text-base font-bold text-textMain mt-0.5">${company.cfo}</h4>
              <p class="text-xs text-textMuted mt-1">Provides explicit quarterly guidance ranges, gross margins, and expense baselines.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 border-t border-black/5 bg-cardWhite flex justify-between items-center">
        <button id="btn-toggle-watchlist" class="px-4 py-2 rounded-full text-xs font-semibold ${isWatchlisted ? "bg-pastelRed text-red-800" : "bg-bgLight text-textMain hover:bg-gray-200"} transition-colors">
          ${isWatchlisted ? "★ Remove from Watchlist" : "☆ Add to Watchlist"}
        </button>
        <div class="flex space-x-2">
          <button id="btn-compare-from-modal" class="px-4 py-2 bg-bgLight rounded-full text-xs text-textMain font-semibold hover:bg-gray-200 transition-colors">Compare</button>
          <button id="btn-view-tracker" class="px-4 py-2 bg-sidebarDark text-white rounded-full text-xs font-semibold hover:bg-black transition-colors">View in Promise Tracker</button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");

  modal.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      modal.querySelectorAll(".tab-btn").forEach(b => {
        b.className = "tab-btn py-2.5 px-4 text-textMuted hover:text-textMain focus:outline-none";
      });
      modal.querySelectorAll(".modal-tab-content").forEach(c => c.classList.add("hidden"));
      btn.className = "tab-btn py-2.5 px-4 text-textMain bg-cardWhite rounded-t-xl border-t border-x border-black/5 focus:outline-none font-bold";
      modal.querySelector(`#${btn.dataset.tab}`).classList.remove("hidden");
    });
  });

  const watchlistBtn = modal.querySelector("#btn-toggle-watchlist");
  watchlistBtn.addEventListener("click", () => {
    const updated = toggleWatchlist(company.ticker);
    watchlistBtn.textContent = updated ? "★ Remove from Watchlist" : "☆ Add to Watchlist";
    watchlistBtn.className = `px-4 py-2 rounded-full text-xs font-semibold ${updated ? "bg-pastelRed text-red-800" : "bg-bgLight text-textMain hover:bg-gray-200"} transition-colors`;
    showToast(
      updated ? "Added to Watchlist" : "Removed from Watchlist",
      `${company.name} (${company.ticker}) saved in local watchlist.`,
      "info"
    );
  });

  modal.querySelector("#btn-compare-from-modal").addEventListener("click", () => {
    modal.remove();
    window.location.hash = `#comparison?compA=${company.ticker}`;
  });

  modal.querySelector("#btn-view-tracker").addEventListener("click", () => {
    modal.remove();
    window.location.hash = `#promises?company=${company.ticker}`;
  });

  modal.querySelector("#modal-close-btn").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
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
