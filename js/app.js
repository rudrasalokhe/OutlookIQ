/**
 * OutlookIQ Main Application Bootstrap (Neo-Brutalist Design)
 * Coordinates navigation shell, global keyboard shortcuts, and router initialization.
 */

import { Router } from "./router.js";
import { showToast } from "./components.js";

function startApp() {
  console.log("OutlookIQ: startApp() starting...");
  try {
    const router = new Router("main-content");
    router.init();
    console.log("OutlookIQ: Router initialized successfully.");
  } catch (err) {
    console.error("OutlookIQ: Router initialization failed:", err);
    const m = document.getElementById("main-content");
    if (m) {
      m.innerHTML = `<div style="background:#fee;border:3px solid #000;padding:24px;margin:20px;font-family:sans-serif;"><h3>Router Start Error</h3><pre>${err.stack || err.message}</pre></div>`;
    }
  }

  // Global Keyboard Shortcut ('Ctrl+K' for quick navigation)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      window.location.hash = "#promises";
      showToast("Quick Navigation", "Navigating to Promise Tracker ledger.");
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
