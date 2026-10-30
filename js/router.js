/**
 * OutlookIQ Hash-Based SPA Router (Neo-Brutalist Design)
 * Seamless single-page client routing, chart lifecycle cleanup,
 * and page title/breadcrumb synchronization.
 */

import { destroyAllCharts } from "./charts.js";
import { renderDashboard } from "./pages/dashboard.js";
import { renderCompanies } from "./pages/companies.js";
import { renderPromises } from "./pages/promises.js";
import { renderAnalytics } from "./pages/analytics.js";
import { renderComparison } from "./pages/comparison.js";
import { renderDocuments } from "./pages/documents.js";
import { renderAnalyst } from "./pages/analyst.js";
import { renderMethodology } from "./pages/methodology.js";
import { renderSettings } from "./pages/settings.js";
import { renderLanding } from "./pages/landing.js";
import { renderProfile } from "./pages/profile.js";
import { authService } from "./auth.js";
import { showToast } from "./components.js";

const ROUTES = {
  landing: {
    title: "Executive Guidance Intelligence",
    breadcrumb: "Landing Page",
    render: renderLanding
  },
  overview: {
    title: "Earnings Intelligence",
    breadcrumb: "Overview",
    render: renderDashboard
  },
  companies: {
    title: "Tracked Issuers",
    breadcrumb: "Companies",
    render: renderCompanies
  },
  promises: {
    title: "Promise Tracker",
    breadcrumb: "Tracker",
    render: renderPromises
  },
  analytics: {
    title: "Guidance Analytics",
    breadcrumb: "Analytics",
    render: renderAnalytics
  },
  comparison: {
    title: "Relative Evaluation",
    breadcrumb: "Compare Firms",
    render: renderComparison
  },
  documents: {
    title: "Document Repository",
    breadcrumb: "Documents",
    render: renderDocuments
  },
  analyst: {
    title: "AI Financial Analyst",
    breadcrumb: "AI Analyst",
    render: renderAnalyst
  },
  methodology: {
    title: "Methodology & Standards",
    breadcrumb: "Methodology",
    render: renderMethodology
  },
  settings: {
    title: "Application Settings",
    breadcrumb: "Settings",
    render: renderSettings
  },
  profile: {
    title: "Institutional Profile & MongoDB",
    breadcrumb: "Profile & DB",
    render: renderProfile
  }
};

export class Router {
  constructor(contentContainerId) {
    this.contentContainerId = contentContainerId;
    this.container = document.getElementById(contentContainerId);
    this.currentRoute = null;
    window.addEventListener("hashchange", () => this.handleRoute());
  }

  init() {
    if (!this.container) {
      this.container = document.getElementById(this.contentContainerId || "main-content");
    }

    const isAuthed = authService.isAuthenticated();
    const currentHash = window.location.hash;

    if (!isAuthed) {
      // Unauthenticated users ALWAYS land on the Landing Page
      if (currentHash !== "#landing") {
        window.location.hash = "#landing";
        return;
      }
    } else {
      // Authenticated users entering without a specific dashboard route go to #overview
      if (!currentHash || currentHash === "#" || currentHash === "#/" || currentHash === "#landing") {
        window.location.hash = "#overview";
        return;
      }
    }

    this.handleRoute();
  }

  parseHash() {
    const rawHash = window.location.hash.slice(1) || "landing";
    const [pathPart, queryPart] = rawHash.split("?");
    const params = {};
    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      for (const [key, val] of searchParams.entries()) {
        params[key] = val;
      }
    }
    return { path: pathPart.toLowerCase() || "landing", params };
  }

  async handleRoute() {
    if (!this.container) {
      this.container = document.getElementById(this.contentContainerId || "main-content");
    }
    const { path, params } = this.parseHash();

    // STRICT AUTHENTICATION GUARD
    // Protect all dashboard views from unauthenticated access
    if (path !== "landing" && !authService.isAuthenticated()) {
      showToast("Access Restricted", "Please sign in or create an account to access the Terminal.");
      window.location.hash = "#landing";
      return;
    }

    const route = ROUTES[path] || (authService.isAuthenticated() ? ROUTES.overview : ROUTES.landing);
    this.currentRoute = path;

    // Dynamically toggle Fullscreen Landing Page vs Dashboard Layout
    const sidebar = document.getElementById("app-sidebar");
    if (path === "landing") {
      if (sidebar) sidebar.style.display = "none";
      if (this.container) {
        this.container.style.padding = "0";
        this.container.style.width = "100vw";
        this.container.style.maxWidth = "100vw";
      }
    } else {
      if (sidebar) sidebar.style.display = "flex";
      if (this.container) {
        this.container.style.padding = "40px";
        this.container.style.width = "";
        this.container.style.maxWidth = "";
      }
    }

    // 1. Destroy active charts from previous page to prevent canvas context leaks
    destroyAllCharts();

    // 2. Synchronize navigation UI
    this.updateNavUI(path, route);

    // 3. Render content
    if (path !== "landing") {
      this.container.innerHTML = `
        <div class="brutal-card bg-yellow" style="padding: 24px; text-align: center; font-weight: 700; text-transform: uppercase;">
          Loading live institutional financial data...
        </div>
      `;
    }
    window.scrollTo({ top: 0, behavior: "instant" });

    try {
      console.log("OutlookIQ: Rendering route:", path);
      await route.render(this.container, params);
      console.log("OutlookIQ: Route rendered successfully:", path);
    } catch (err) {
      console.error("Routing error for " + path + ":", err);
      this.container.innerHTML = `
        <div class="brutal-card bg-pink" style="padding: 32px; text-align: center;">
          <h2 style="font-size: 1.5rem; text-transform: uppercase; margin-bottom: 8px;">Error Loading View: ${path}</h2>
          <p style="font-weight: 600; margin-bottom: 16px;">${err.message}</p>
          <pre style="text-align:left;background:#fff;padding:12px;border:2px solid #000;font-size:0.8rem;overflow-x:auto;">${err.stack || ""}</pre>
          <a href="#landing" class="brutal-btn" style="background: var(--main-yellow); margin-top: 14px;">Return to Landing Page</a>
        </div>
      `;
    }
  }

  updateNavUI(path, route) {
    // Update Document Title
    document.title = `${route.breadcrumb} — OutlookIQ`;

    // Update Sidebar Active Links
    document.querySelectorAll(".nav-item").forEach(link => {
      const href = link.getAttribute("href");
      if (href && href.startsWith(`#${path}`)) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Synchronize Logged In User in Sidebar
    const user = authService.getUser();
    if (user) {
      const nameEl = document.getElementById("sidebar-user-name");
      const roleEl = document.getElementById("sidebar-user-role");
      const avatarEl = document.getElementById("sidebar-user-avatar");

      if (nameEl) nameEl.textContent = user.full_name || "Quant Strategist";
      if (roleEl) roleEl.textContent = user.role || user.organization || "Analyst";
      if (avatarEl) {
        const initials = (user.full_name || "RS")
          .split(" ")
          .map(w => w[0])
          .filter(Boolean)
          .join("")
          .slice(0, 2)
          .toUpperCase();
        avatarEl.textContent = initials || "OQ";
      }
    }

    // Bind Sidebar Logout Button
    const logoutBtn = document.getElementById("btn-sidebar-logout");
    if (logoutBtn && !logoutBtn._hasLogoutListener) {
      logoutBtn._hasLogoutListener = true;
      logoutBtn.addEventListener("click", () => {
        authService.logout();
        showToast("Signed Out", "Your terminal session has ended.");
        window.location.hash = "#landing";
      });
    }
  }
}
