---
name: slexkit
description: Author and validate HTML-first SlexKit interactive Markdown artifacts.
---

# SlexKit HTML authoring

Read `AGENTS.slexkit.md`, `docs/html-migration-contract.md`, `docs/web-components.md`, and `dist/custom-elements.json` before authoring.

Create `slex` fences containing standard HTML/SVG, optional CSS, supported `slex-*` elements, and optional inline module scripts. Use ordinary DOM properties/events and the sandbox `slex` SDK. Never generate object `g/layout` source, expression attributes, registration/import code, or unsupported component names.

For interactive work:

- assign stable `id` or `data-key` values;
- use `slex.root` for scoped queries;
- release listeners and side effects with `slex.onDispose`;
- use `slex.onSnapshot`/`slex.onRestore` only for explicit hidden-state persistence;
- use `slex.shared` only for JSON artifact-local state;
- use only host-approved operations exposed by `slex.api`.

Validate with the static inspector or `slex validate`. Validation must not execute payload scripts. Treat isolated-frame execution as the security boundary and report runtime/browser proof separately from static validation.

Use the current `html-1` profile. The frame policy denies direct payload resource loads in supported browsers, but it is not a universal egress firewall because iframe self-navigation can still issue a request. Do not claim CPU preemption; hostile execution needs external browser/process controls and timeouts.
