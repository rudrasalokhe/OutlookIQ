/**
 * OutlookIQ Hash-Based SPA Router
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

const ROUTES = {
  overview: {
    title: "Earnings Intelligence Overview",
    breadcrumb: "Overview",
    render: renderDashboard
  },
  companies: {
    title: "Company Explorer",
    breadcrumb: "Companies",
    render: renderCompanies
  },
  promises: {
    title: "Management Promise Tracker",
    breadcrumb: "Promise Tracker",
    render: renderPromises
  },
  analytics: {
    title: "Guidance Analytics",
    breadcrumb: "Analytics",
    render: renderAnalytics
  },
  comparison: {
    title: "Compare Companies",
    breadcrumb: "Comparison",
    render: renderComparison
  },
  documents: {
    title: "Financial Document Library",
    breadcrumb: "Documents",
    render: renderDocuments
  },
  analyst: {
    title: "AI Financial Analyst",
    breadcrumb: "AI Analyst",
    render: renderAnalyst
  },
  methodology: {
    title: "Methodology & Transparency",
    breadcrumb: "Methodology",
    render: renderMethodology
  },
  settings: {
    title: "Application Settings",
    breadcrumb: "Settings",
    render: renderSettings
  }
};

export class Router {
  constructor(contentContainerId) {
    this.container = document.getElementById(contentContainerId);
    this.currentRoute = null;
    window.addEventListener("hashchange", () => this.handleRoute());
  }

  init() {
    if (!window.location.hash) {
      window.location.hash = "#overview";
    } else {
      this.handleRoute();
    }
  }

  parseHash() {
    const rawHash = window.location.hash.slice(1) || "overview";
    const [pathPart, queryPart] = rawHash.split("?");
    const params = {};
    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      for (const [key, val] of searchParams.entries()) {
        params[key] = val;
      }
    }
    return { path: pathPart.toLowerCase() || "overview", params };
  }

  async handleRoute() {
    const { path, params } = this.parseHash();
    const route = ROUTES[path] || ROUTES.overview;
    this.currentRoute = path;

    // 1. Destroy active charts from previous page to prevent canvas context leaks
    destroyAllCharts();

    // 2. Synchronize navigation UI
    this.updateNavUI(path, route);

    // 3. Render content
    this.container.innerHTML = `<div class="page-loading-skeleton"><span class="pulse-dot"></span> Loading financial data...</div>`;
    window.scrollTo({ top: 0, behavior: "instant" });

    try {
      await route.render(this.container, params);
    } catch (err) {
      console.error("Routing error:", err);
      this.container.innerHTML = `
        <div class="card p-8 text-center">
          <h2 class="text-danger mb-2">Error Loading Page</h2>
          <p class="text-muted mb-4">${err.message}</p>
          <a href="#overview" class="btn btn-primary">Return to Overview</a>
        </div>
      `;
    }
  }

  updateNavUI(path, route) {
    // Update Document Title
    document.title = `${route.breadcrumb} — OutlookIQ Financial Intelligence`;

    // Update Topbar Title & Breadcrumb
    const topbarTitle = document.getElementById("topbar-title");
    const topbarBreadcrumb = document.getElementById("topbar-breadcrumb");
    if (topbarTitle) topbarTitle.textContent = route.title;
    if (topbarBreadcrumb) topbarBreadcrumb.textContent = `OutlookIQ / ${route.breadcrumb}`;

    // Update Sidebar Active Links
    document.querySelectorAll(".nav-item").forEach(link => {
      const href = link.getAttribute("href");
      if (href && href.startsWith(`#${path}`)) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Close mobile sidebar on route change if open
    const sidebar = document.getElementById("app-sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (sidebar && sidebar.classList.contains("mobile-open")) {
      sidebar.classList.remove("mobile-open");
      if (backdrop) backdrop.classList.remove("open");
    }
  }
}
