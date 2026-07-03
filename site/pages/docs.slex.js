export function createPage({
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
    namespace: "site_docs_wiki",
    g: {
      docs,
      activeHref,
      doc: currentDoc,
      countLabel,
      locale,
      playgroundHrefBase,
      uiLabels,
      emptyText,
    },
    layout: {
      "docs-shell:site": {
        $label: "g.uiLabels.docsLabel || 'Docs'",
        $items: "g.docs",
        $active: "g.activeHref",
        $countLabel: "g.countLabel",
        $doc: "g.doc",
        $emptyText: "g.emptyText",
        $locale: "g.locale",
        $playgroundHrefBase: "g.playgroundHrefBase",
        $uiLabels: "g.uiLabels",
      },
    },
  };
}
