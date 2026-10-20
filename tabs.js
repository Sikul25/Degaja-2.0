(() => {
  "use strict";
  // Mobile-only tab navigation: below the breakpoint where the header nav
  // already hides (see style.css `@media(max-width:1100px){.nav{display:none}}`),
  // a long single scroll with no nav at all is the worst of both worlds.
  // This groups the page's top-level <section data-tab="..."> elements into
  // a handful of screens behind a fixed bottom tab bar, like a native app.
  // Above the breakpoint the page is untouched: full scroll, full top nav.
  const BREAKPOINT = "(max-width: 1100px)";
  const DEFAULT_TAB = "start";

  function tabActive() {
    return window.matchMedia(BREAKPOINT).matches;
  }

  function allSections() {
    return Array.from(document.querySelectorAll("[data-tab]"));
  }

  function currentTab() {
    return document.body.dataset.activeTab || DEFAULT_TAB;
  }

  function applyTabVisibility(tab) {
    if (!tabActive()) {
      allSections().forEach(el => { el.style.display = ""; });
      return;
    }
    allSections().forEach(el => {
      el.style.display = el.dataset.tab === tab ? "" : "none";
    });
  }

  function setActiveTab(tab, { scrollTop = true } = {}) {
    document.body.dataset.activeTab = tab;
    applyTabVisibility(tab);
    document.querySelectorAll(".app-tabbar .tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.goTab === tab);
    });
    if (scrollTop && tabActive()) window.scrollTo({ top: 0, behavior: "instant" in document.documentElement.style ? "instant" : "auto" });
  }

  // Public helper: jump to any element, switching tabs first if needed.
  // Used by cross-section links (hero CTA, payment-return redirects, the
  // ritual modal's "talk to an advisor" button, etc.) instead of a raw
  // scrollIntoView, so they still land in the right place once the page
  // is split into tabs on mobile.
  window.degajaGoTo = function (selectorOrEl, opts) {
    const el = typeof selectorOrEl === "string" ? document.querySelector(selectorOrEl) : selectorOrEl;
    if (!el) return;
    const options = Object.assign({ behavior: "smooth", block: "start" }, opts);
    const host = el.closest("[data-tab]");
    const targetTab = host ? host.dataset.tab : null;

    if (targetTab && tabActive() && targetTab !== currentTab()) {
      setActiveTab(targetTab, { scrollTop: false });
      // Let the newly-visible section lay out before measuring its position.
      requestAnimationFrame(() => requestAnimationFrame(() => el.scrollIntoView(options)));
    } else {
      el.scrollIntoView(options);
    }
  };

  function init() {
    const bar = document.getElementById("appTabbar");
    if (!bar) return;

    bar.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => setActiveTab(btn.dataset.goTab));
    });

    // A direct link/bookmark to e.g. #palm should open on the Readings tab.
    const hashTarget = location.hash && document.querySelector(location.hash);
    const hashHost = hashTarget && hashTarget.closest("[data-tab]");
    setActiveTab(hashHost ? hashHost.dataset.tab : DEFAULT_TAB, { scrollTop: false });
    if (hashTarget) requestAnimationFrame(() => requestAnimationFrame(() => hashTarget.scrollIntoView()));

    let wasActive = tabActive();
    window.addEventListener("resize", () => {
      const isActive = tabActive();
      if (isActive !== wasActive) {
        wasActive = isActive;
        applyTabVisibility(currentTab());
      }
    });

    // Any same-page #anchor link (logo, footer FAQ, in-section cross-links,
    // future ones too) goes through degajaGoTo instead of the browser's
    // native jump, so it still works once a section can be tab-hidden.
    document.addEventListener("click", event => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      const hash = link.getAttribute("href");
      if (!hash || hash.length < 2) return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      window.degajaGoTo(target);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
