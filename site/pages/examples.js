export function createExamplesShellProps({
  activeHref = "/examples",
  currentDoc = null,
  docs = [],
  locale = "en-US",
  playgroundHrefBase = "/playground.html",
  uiLabels = {},
} = {}) {
  return {
    label: uiLabels.examplesLabel || "Examples",
    items: docs,
    active: activeHref,
    doc: currentDoc,
    locale,
    playgroundHrefBase,
    uiLabels,
  };
}
