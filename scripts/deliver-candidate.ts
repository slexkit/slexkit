throw new Error(
  [
    "Legacy candidate delivery is disabled because it merges v0.5 object-DSL and Obsidian desktop evidence.",
    "Use the current HTML candidate workflow only after `test-results/html-migration/run.json` reports `kind: html-migration-conformance` and `status: passed`.",
    "This helper intentionally creates no report, archive, patch, or acceptance status.",
  ].join(" "),
);
