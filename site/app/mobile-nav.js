import { siteUiLabelsForLocale } from "../data/component-docs.js";
import { withSiteBase } from "./site-base.js";

const systemEdgeGuardPx = 16;
const mobileNavGestureZonePx = 72;
const mobileNavSwipeThreshold = 0.32;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function groupedDocs(docs) {
  const groups = [];
  const byKey = new Map();
  for (const doc of docs) {
    const label = doc.group ?? doc.category ?? "Docs";
    const key = doc.groupKey ?? label;
    if (!byKey.has(key)) {
      const group = { key, label, items: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key).items.push(doc);
  }
  return groups;
}

export function createMobileNav({ currentLocale, hydratePhosphorIcons }) {
  const navMenuBtn = document.getElementById("navMenuBtn");
  const mobileNav = document.getElementById("mobileNav");
  const mobileNavPanel = document.querySelector("[data-mobile-nav-panel]");
  const mobileNavContext = document.querySelector("[data-mobile-nav-context]");
  const mobileNavLinks = Array.from(document.querySelectorAll("[data-mobile-nav-link]"));
  const mobileNavCloseButtons = Array.from(document.querySelectorAll("[data-mobile-nav-close]"));
  let mobileNavGesture = null;

  function setMobileNavOpen(open) {
    if (!mobileNav) return;
    mobileNav.dataset.open = open ? "true" : "false";
    mobileNav.setAttribute("aria-hidden", open ? "false" : "true");
    navMenuBtn?.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.toggleAttribute("data-mobile-nav-open", open);
    const icon = navMenuBtn?.querySelector("[data-phosphor-icon]");
    if (icon instanceof HTMLElement) {
      icon.dataset.phosphorIcon = open ? "x" : "list";
      hydratePhosphorIcons(navMenuBtn);
    }
  }

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  function isMobileNavViewport() {
    return window.matchMedia("(max-width: 1023px)").matches;
  }

  function isMobileNavOpen() {
    return mobileNav?.dataset.open === "true";
  }

  function setMobileNavGestureFrame({ translate, opacity }) {
    if (!mobileNav) return;
    mobileNav.style.setProperty("--mobile-nav-panel-translate", `${translate}px`);
    mobileNav.style.setProperty("--mobile-nav-backdrop-opacity", String(opacity));
  }

  function clearMobileNavGestureFrame() {
    if (!mobileNav) return;
    window.requestAnimationFrame(() => {
      mobileNav.style.removeProperty("--mobile-nav-panel-translate");
      mobileNav.style.removeProperty("--mobile-nav-backdrop-opacity");
    });
  }

  function beginMobileNavGesture(event) {
    if (!mobileNav || !mobileNavPanel || !isMobileNavViewport()) return;
    if (event.button !== undefined && event.button !== 0) return;

    const panelRect = mobileNavPanel.getBoundingClientRect();
    const panelWidth = panelRect.width || 280;
    const open = isMobileNavOpen();

    if (!open) {
      const startLimit = Math.min(mobileNavGestureZonePx, window.innerWidth * 0.24);
      if (event.clientX < systemEdgeGuardPx || event.clientX > startLimit) return;
      mobileNavGesture = {
        type: "open",
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        panelWidth,
        active: false,
      };
      return;
    }

    if (event.clientX > panelRect.right) return;
    mobileNavGesture = {
      type: "close",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panelWidth,
      active: false,
    };
  }

  function updateMobileNavGesture(event) {
    if (!mobileNavGesture || event.pointerId !== mobileNavGesture.pointerId) return;

    const dx = event.clientX - mobileNavGesture.startX;
    const dy = event.clientY - mobileNavGesture.startY;
    const horizontal = Math.abs(dx);
    const vertical = Math.abs(dy);

    if (!mobileNavGesture.active) {
      if (vertical > 24 && vertical > horizontal) {
        mobileNavGesture = null;
        return;
      }
      if (horizontal < 10) return;
      if (mobileNavGesture.type === "open" && dx <= 0) return;
      if (mobileNavGesture.type === "close" && dx >= 0) return;

      mobileNavGesture.active = true;
      mobileNav.dataset.dragging = "true";
      if (mobileNavGesture.type === "open") {
        setMobileNavGestureFrame({ translate: -mobileNavGesture.panelWidth, opacity: 0 });
        setMobileNavOpen(true);
      }
    }

    event.preventDefault();

    if (mobileNavGesture.type === "open") {
      const distance = clamp(dx, 0, mobileNavGesture.panelWidth);
      const progress = distance / mobileNavGesture.panelWidth;
      setMobileNavGestureFrame({
        translate: -mobileNavGesture.panelWidth + distance,
        opacity: progress,
      });
      return;
    }

    const distance = clamp(-dx, 0, mobileNavGesture.panelWidth);
    const progress = distance / mobileNavGesture.panelWidth;
    setMobileNavGestureFrame({
      translate: -distance,
      opacity: 1 - progress,
    });
  }

  function finishMobileNavGesture(event) {
    if (!mobileNavGesture || event.pointerId !== mobileNavGesture.pointerId) return;

    const dx = event.clientX - mobileNavGesture.startX;
    const progress = Math.abs(dx) / mobileNavGesture.panelWidth;
    const shouldOpen =
      mobileNavGesture.type === "open"
        ? progress >= mobileNavSwipeThreshold || dx > 72
        : !(progress >= mobileNavSwipeThreshold || dx < -72);

    if (mobileNavGesture.active) {
      delete mobileNav.dataset.dragging;
      setMobileNavOpen(shouldOpen);
      clearMobileNavGestureFrame();
    }

    mobileNavGesture = null;
  }

  function cancelMobileNavGesture() {
    if (!mobileNavGesture) return;
    const shouldRemainOpen = mobileNavGesture.type === "close";
    if (mobileNavGesture.active) {
      delete mobileNav.dataset.dragging;
      setMobileNavOpen(shouldRemainOpen);
      clearMobileNavGestureFrame();
    }
    mobileNavGesture = null;
  }

  function clearContext() {
    mobileNavContext?.replaceChildren();
    if (mobileNavContext) mobileNavContext.hidden = true;
  }

  function navLink(doc, activeHref) {
    const link = document.createElement("a");
    link.href = withSiteBase(doc.href);
    link.className = doc.href === activeHref ? "slex-doc-nav-link active" : "slex-doc-nav-link";
    link.textContent = doc.title;
    link.title = doc.summary || doc.title;
    link.dataset.mobileNavLink = "";
    if (doc.href === activeHref) link.setAttribute("aria-current", "page");
    return link;
  }

  function renderDocsContext(docs, activeDoc) {
    if (!mobileNavContext) return;
    const labels = siteUiLabelsForLocale(currentLocale());
    mobileNavContext.replaceChildren();
    mobileNavContext.hidden = !docs.length;
    if (!docs.length) return;

    const title = document.createElement("div");
    title.className = "mb-3 px-3 text-sm font-semibold text-foreground";
    title.textContent = labels.docsLabel;

    const nav = document.createElement("nav");
    nav.className = "grid gap-4";
    nav.setAttribute("aria-label", labels.docsLabel);
    for (const group of groupedDocs(docs)) {
      const section = document.createElement("section");
      section.className = "grid gap-1";
      const header = document.createElement("div");
      header.className = "px-3 text-xs font-semibold text-muted-foreground";
      header.textContent = group.label;
      section.appendChild(header);
      for (const doc of group.items) {
        section.appendChild(navLink(doc, activeDoc.href));
      }
      nav.appendChild(section);
    }

    mobileNavContext.append(title, nav);
  }

  navMenuBtn?.addEventListener("click", () => {
    setMobileNavOpen(navMenuBtn.getAttribute("aria-expanded") !== "true");
  });

  for (const link of mobileNavLinks) link.addEventListener("click", closeMobileNav);
  mobileNav?.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a[data-mobile-nav-link]") : null;
    if (link) closeMobileNav();
  });
  for (const button of mobileNavCloseButtons) button.addEventListener("click", closeMobileNav);

  window.addEventListener("pointerdown", beginMobileNavGesture);
  window.addEventListener("pointermove", updateMobileNavGesture, { passive: false });
  window.addEventListener("pointerup", finishMobileNavGesture);
  window.addEventListener("pointercancel", cancelMobileNavGesture);
  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 1024px)").matches) closeMobileNav();
  });

  return {
    clearContext,
    closeMobileNav,
    renderDocsContext,
  };
}
