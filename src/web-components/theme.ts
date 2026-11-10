type ThemeListener = () => void;
const documents = new WeakMap<Document, { listeners: Set<ThemeListener>; stop(): void }>();

/** Shadow roots cannot match a document ancestor's .dark selector. Mirror only
 * that theme signal; CSS custom properties still inherit through native slots. */
export function watchElementTheme(
  element: HTMLElement,
  update: (dark: boolean) => void,
): () => void {
  const document = element.ownerDocument;
  const owner = document.defaultView;
  let shared = documents.get(document);
  if (!shared) {
    const listeners = new Set<ThemeListener>();
    const broadcast = () => {
      for (const listener of listeners) listener();
    };
    const observer = owner?.MutationObserver ? new owner.MutationObserver(broadcast) : undefined;
    observer?.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ["class", "data-theme"],
    });
    const media = owner?.matchMedia?.("(prefers-color-scheme: dark)");
    media?.addEventListener?.("change", broadcast);
    shared = {
      listeners,
      stop() {
        observer?.disconnect();
        media?.removeEventListener?.("change", broadcast);
      },
    };
    documents.set(document, shared);
  }
  const listener = () => {
    const explicit = element.closest('.dark, .light, [data-theme="dark"], [data-theme="light"]');
    update(
      explicit
        ? explicit.getAttribute("data-theme") === "dark" || explicit.classList.contains("dark")
        : !!owner?.matchMedia?.("(prefers-color-scheme: dark)").matches,
    );
  };
  shared.listeners.add(listener);
  listener();
  return () => {
    shared.listeners.delete(listener);
    if (!shared.listeners.size) {
      shared.stop();
      documents.delete(document);
    }
  };
}
