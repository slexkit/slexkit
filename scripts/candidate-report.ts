throw new Error(
  [
    "Legacy v0.5 object-DSL candidate reporting is retired and this helper fails closed.",
    "Run `node scripts/behavior-conformance.mjs` and require a passed `test-results/html-migration/run.json`.",
    "Use `bun scripts/html-candidate-report.ts` after pinning/building the plugin and recording current desktop evidence. Do not reuse v05-candidate, protocol 0.1, or prior desktop DSL evidence.",
  ].join(" "),
);
