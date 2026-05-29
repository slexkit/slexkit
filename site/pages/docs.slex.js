export function createPage({
  activeHref = "/docs/guides/intro",
  currentDoc = null,
  docs = [],
  countLabel = "",
  locale = "en-US",
  uiLabels = {},
} = {}) {
  return {
    namespace: "site_docs_wiki",
    g: {
      docs,
      activeHref,
      doc: currentDoc,
      countLabel,
      locale,
      uiLabels,
    },
    layout: {
      "docs-shell:site": {
        $label: "g.uiLabels.docsLabel || 'Docs'",
        $items: "g.docs",
        $active: "g.activeHref",
        $countLabel: "g.countLabel",
        $doc: "g.doc",
        $locale: "g.locale",
        $uiLabels: "g.uiLabels",
      },
    },
  };
}
