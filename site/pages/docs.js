export function createDocsShellProps({
  activeHref = "/docs/guides/intro",
  currentDoc = null,
  docs = [],
  countLabel = "",
  locale = "en-US",
  playgroundHrefBase = "/playground.html",
  uiLabels = {},
  emptyText = uiLabels.docNotFound || uiLabels.noDocsFound || "Document not found.",
} = {}) {
  return {
    label: uiLabels.docsLabel || "Docs",
    items: docs,
    active: activeHref,
    countLabel,
    doc: currentDoc,
    emptyText,
    locale,
    playgroundHrefBase,
    uiLabels,
  };
}
