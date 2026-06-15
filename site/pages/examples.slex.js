export function createPage({
  activeHref = "/examples",
  currentDoc = null,
  docs = [],
  locale = "en-US",
  playgroundHrefBase = "/playground.html",
  uiLabels = {},
} = {}) {
  return {
    namespace: "site_examples",
    g: {
      docs,
      activeHref,
      doc: currentDoc,
      locale,
      playgroundHrefBase,
      uiLabels,
    },
    layout: {
      "docs-shell:examples": {
        $label: "g.uiLabels.examplesLabel || 'Examples'",
        $items: "g.docs",
        $active: "g.activeHref",
        $doc: "g.doc",
        $locale: "g.locale",
        $playgroundHrefBase: "g.playgroundHrefBase",
        $uiLabels: "g.uiLabels",
      },
    },
  };
}
