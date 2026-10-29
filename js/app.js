/**
 * OutlookIQ Main Application Bootstrap
 * Coordinates navigation shell, global search, notifications,
 * theme initialization, and responsive sidebar state.
 */

import { Router } from "./router.js";
import { MOCK_COMPANIES, MOCK_NOTIFICATIONS } from "./mockData.js";
import { showToast } from "./components.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Theme & Density from LocalStorage
  const savedTheme = localStorage.getItem("outlookiq_theme") || "dark";
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
  }

  const isCompact = localStorage.getItem("outlookiq_compact") === "true";
  if (isCompact) {
    document.body.classList.add("compact-mode");
  }

  const isSidebarCollapsed = localStorage.getItem("outlookiq_sidebar_collapsed") === "true";
  if (isSidebarCollapsed) {
    document.body.classList.add("sidebar-collapsed");
  }

  // 2. Initialize Router
  const router = new Router("main-content");
  router.init();

  // 3. Initialize Global Search
  initGlobalSearch();

  // 4. Initialize Notifications Dropdown
  initNotifications();

  // 5. Initialize Sidebar & Mobile Controls
  initSidebarControls();

  // 6. User Profile Dropdown
  initUserDropdown();

  // 7. Global Keyboard Shortcut (Cmd+K / Ctrl+K / '/' for search)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      const search = document.getElementById("global-search-input");
      if (search) search.focus();
    }
  });
});

/**
 * Global Search Dropdown Logic
 */
function initGlobalSearch() {
  const input = document.getElementById("global-search-input");
  const dropdown = document.getElementById("global-search-dropdown");
  if (!input || !dropdown) return;

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      dropdown.classList.remove("open");
      return;
    }

    const matches = MOCK_COMPANIES.filter(c =>
      c.ticker.toLowerCase().includes(query) ||
      c.name.toLowerCase().includes(query) ||
      c.sector.toLowerCase().includes(query)
    );

    if (matches.length === 0) {
      dropdown.innerHTML = `<div class="search-item search-empty">No matching companies found</div>`;
    } else {
      dropdown.innerHTML = matches.map(c => `
        <div class="search-item" data-ticker="${c.ticker}">
          <div class="company-avatar-xs" style="background:${c.accentColor}20; color:${c.accentColor}">
            ${c.monogram}
          </div>
          <div class="search-item-info">
            <span class="search-ticker">${c.ticker}</span>
            <span class="search-name">${c.name}</span>
          </div>
          <span class="search-sector">${c.sector}</span>
        </div>
      `).join("");

      dropdown.querySelectorAll(".search-item[data-ticker]").forEach(item => {
        item.addEventListener("click", () => {
          const ticker = item.dataset.ticker;
          input.value = "";
          dropdown.classList.remove("open");
          window.location.hash = `#promises?company=${ticker}`;
        });
      });
    }

    dropdown.classList.add("open");
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== input) {
      dropdown.classList.remove("open");
    }
  });
}

/**
 * Real In-App Notifications Dropdown
 */
function initNotifications() {
  const btn = document.getElementById("btn-notifications");
  const dropdown = document.getElementById("notifications-dropdown");
  const badge = document.getElementById("notif-badge-count");
  if (!btn || !dropdown) return;

  let notifications = [...MOCK_NOTIFICATIONS];

  function updateBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  }

  function renderList() {
    dropdown.innerHTML = `
      <div class="dropdown-header">
        <span class="dropdown-title">System & Guidance Alerts</span>
        <button class="btn-link font-xs" id="btn-mark-all-read">Mark all read</button>
      </div>
      <div class="dropdown-body">
        ${notifications.map(n => `
          <div class="notif-item ${n.read ? "read" : "unread"}" data-notif-id="${n.id}">
            <div class="notif-dot ${n.type}"></div>
            <div class="notif-text">
              <div class="notif-title-row">
                <span class="notif-title">${n.title}</span>
                <span class="notif-time">${n.timestamp}</span>
              </div>
              <p class="notif-desc">${n.description}</p>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    document.getElementById("btn-mark-all-read")?.addEventListener("click", () => {
      notifications.forEach(n => n.read = true);
      renderList();
      updateBadge();
      showToast("Alerts Cleared", "All notifications marked as read.", "info");
    });

    dropdown.querySelectorAll(".notif-item").forEach(item => {
      item.addEventListener("click", () => {
        const id = item.dataset.notifId;
        const target = notifications.find(n => n.id === id);
        if (target) target.read = true;
        renderList();
        updateBadge();
      });
    });
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    renderList();
    dropdown.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== btn) {
      dropdown.classList.remove("open");
    }
  });

  updateBadge();
}

/**
 * Sidebar Collapse & Mobile Hamburger Controls
 */
function initSidebarControls() {
  const collapseBtn = document.getElementById("btn-collapse-sidebar");
  const hamburgerBtn = document.getElementById("btn-mobile-hamburger");
  const sidebar = document.getElementById("app-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");

  if (collapseBtn) {
    collapseBtn.addEventListener("click", () => {
      const willCollapse = !document.body.classList.contains("sidebar-collapsed");
      document.body.classList.toggle("sidebar-collapsed", willCollapse);
      localStorage.setItem("outlookiq_sidebar_collapsed", String(willCollapse));
    });
  }

  if (hamburgerBtn && sidebar && backdrop) {
    hamburgerBtn.addEventListener("click", () => {
      sidebar.classList.toggle("mobile-open");
      backdrop.classList.toggle("open");
    });

    backdrop.addEventListener("click", () => {
      sidebar.classList.remove("mobile-open");
      backdrop.classList.remove("open");
    });
  }
}

/**
 * Topbar User Avatar Dropdown
 */
function initUserDropdown() {
  const avatarBtn = document.getElementById("btn-user-avatar");
  const menu = document.getElementById("user-menu-dropdown");
  if (!avatarBtn || !menu) return;

  avatarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && e.target !== avatarBtn) {
      menu.classList.remove("open");
    }
  });
}
