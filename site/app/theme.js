const THEME_STORAGE_KEY = "slexkit:theme";
const THEME_MODES = new Set(["light", "dark"]);

function storedTheme() {
  try {
    const value = window.localStorage?.getItem(THEME_STORAGE_KEY);
    return THEME_MODES.has(value) ? value : null;
  } catch {
    return null;
  }
}

function preferredTheme() {
  const stored = storedTheme();
  if (stored) return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

function persistTheme(theme) {
  try {
    window.localStorage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable in privacy-restricted contexts.
  }
}

export function applySiteTheme(theme, { persist = false } = {}) {
  const mode = theme === "dark" ? "dark" : "light";
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.classList.toggle("light", mode === "light");
  root.dataset.theme = mode;
  if (persist) persistTheme(mode);
  return mode;
}

function syncThemeButton(button, theme) {
  if (!button) return;
  const dark = theme === "dark";
  button.setAttribute("aria-pressed", dark ? "true" : "false");
  button.dataset.themeState = theme;
}

export function initSiteTheme(button = document.getElementById("themeBtn")) {
  const initial = applySiteTheme(preferredTheme());
  syncThemeButton(button, initial);

  button?.addEventListener("click", () => {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    syncThemeButton(button, applySiteTheme(next, { persist: true }));
  });

  return initial;
}
