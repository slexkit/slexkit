import type { ThemeMode } from "./types";

/**
 * The complete shadcn semantic palette required before automatic detection may
 * opt into host theming. Optional SlexKit sizing and motion tokens are not part
 * of detection.
 */
export const REQUIRED_HOST_THEME_TOKENS = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--destructive-foreground",
  "--border",
  "--input",
  "--ring",
] as const;

export const TRANSFER_THEME_TOKENS = [
  ...REQUIRED_HOST_THEME_TOKENS, "--radius", "--font-sans", "--font-mono",
  "--info", "--info-foreground", "--success", "--success-foreground", "--warning", "--warning-foreground",
  "--shadow-sm", "--shadow-md", "--shadow-lg", "--shadow-xl",
  "--slex-control-height", "--slex-control-gap", "--slex-surface-padding",
  "--slex-focus-ring-width", "--slex-motion-duration", "--slex-motion-easing",
] as const;

export function readThemeTokens(container: HTMLElement): Record<string, string> {
  const style = (container.ownerDocument.defaultView ?? window).getComputedStyle(container);
  return Object.fromEntries(TRANSFER_THEME_TOKENS.map(token => [token, style.getPropertyValue(token).trim()]).filter(([,value])=>value));
}

function hasCompleteHostTheme(container: HTMLElement): boolean {
  const style = (container.ownerDocument.defaultView ?? window).getComputedStyle(container);
  return REQUIRED_HOST_THEME_TOKENS.every(
    (token) => style.getPropertyValue(token).trim().length > 0,
  );
}

function inheritedSlexTheme(container: HTMLElement): Exclude<ThemeMode, "auto"> | undefined {
  for (let ancestor = container.parentElement; ancestor; ancestor = ancestor.parentElement) {
    if (!ancestor.localName.startsWith("slex-")) continue;
    const root = ancestor.shadowRoot?.querySelector<HTMLElement>(".slexkit-root");
    if (root?.classList.contains("slexkit-theme-host-shadcn")) return "host-shadcn";
    if (root?.classList.contains("slexkit-theme-flowbite")) return "flowbite";
    if (root?.classList.contains("slexkit-theme-uno")) return "uno";
  }
  return undefined;
}

export function resolveThemeMode(
  container: HTMLElement,
  requested: ThemeMode = "auto",
): Exclude<ThemeMode, "auto"> {
  if (requested !== "auto") return requested;
  if (container.closest(".slexkit-theme-flowbite")) return "flowbite";
  if (container.closest(".slexkit-theme-uno")) return "uno";
  if (container.closest(".slexkit-theme-host-shadcn")) return "host-shadcn";
  const inherited = inheritedSlexTheme(container);
  if (inherited) return inherited;
  return hasCompleteHostTheme(container) ? "host-shadcn" : "uno";
}

const THEME_CLASSES = [
  "slexkit-theme-uno",
  "slexkit-theme-flowbite",
  "slexkit-theme-host-shadcn",
] as const;

/** Keep a shadow-root mount on the same theme contract as the surrounding
 * document. Automatic host theming is intentionally all-or-nothing: a partial
 * palette falls back to the built-in Uno theme instead of mixing unrelated
 * colors. */
export function observeThemeMode(
  root: HTMLElement,
  container: HTMLElement,
  requested: ThemeMode = "auto",
): () => void {
  const owner = container.ownerDocument.defaultView;
  const update = () => {
    const mode = resolveThemeMode(container, requested);
    for (const className of THEME_CLASSES)
      root.classList.toggle(className, className === `slexkit-theme-${mode}`);
    updateIncompletePalette(root, container, mode === "host-shadcn");
  };
  update();
  const Observer = owner?.MutationObserver;
  const observer = Observer
    ? new Observer((records) => {
        if (records.some((record) => (record.target as Element).contains(container))) update();
      })
    : undefined;
  observer?.observe(container.ownerDocument.documentElement, {
    attributes: true,
    subtree: true,
    attributeFilter: ["class", "style", "data-theme"],
  });
  const parentRoot = (() => {
    for (let ancestor = container.parentElement; ancestor; ancestor = ancestor.parentElement) {
      if (!ancestor.localName.startsWith("slex-")) continue;
      const candidate = ancestor.shadowRoot?.querySelector<HTMLElement>(".slexkit-root");
      if (candidate) return candidate;
    }
  })();
  const parentObserver = parentRoot && Observer ? new Observer(update) : undefined;
  parentObserver?.observe(parentRoot!, { attributes: true, attributeFilter: ["class"] });
  // A host stylesheet can finish loading after the element connects without
  // mutating an ancestor attribute.
  container.ownerDocument.addEventListener("load", update, true);
  return () => {
    observer?.disconnect();
    parentObserver?.disconnect();
    container.ownerDocument.removeEventListener("load", update, true);
  };
}

function updateIncompletePalette(
  root: HTMLElement,
  container: HTMLElement,
  hostTheme: boolean,
): void {
  if (!hostTheme) {
    root.removeAttribute("data-slex-incomplete-palette");
    return;
  }
  const pairs = [
    "background",
    "card",
    "popover",
    "primary",
    "secondary",
    "muted",
    "accent",
    "destructive",
    "info",
    "success",
    "warning",
  ];
  const style = container.ownerDocument.defaultView?.getComputedStyle(container);
  const incomplete = pairs.some((name) => {
    const foreground = name === "background" ? "foreground" : `${name}-foreground`;
    return (
      !!style?.getPropertyValue(`--${name}`).trim() !==
      !!style?.getPropertyValue(`--${foreground}`).trim()
    );
  });
  root.toggleAttribute("data-slex-incomplete-palette", incomplete);
}

/** An unpaired host background/foreground must not produce unreadable controls. */
export function observeHostThemePalette(root: HTMLElement, container: HTMLElement): () => void {
  const update = () => {
    updateIncompletePalette(root, container, true);
  };
  update();
  const Observer = container.ownerDocument.defaultView?.MutationObserver;
  const observer = Observer ? new Observer(records => {
    if (records.some(record => (record.target as Element).contains(container))) update();
  }) : undefined;
  observer?.observe(container.ownerDocument.documentElement, {attributes:true,subtree:true,attributeFilter:["class","style"]});
  return () => observer?.disconnect();
}
