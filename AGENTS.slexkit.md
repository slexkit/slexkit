# SlexKit authoring rules

Use these rules when generating content for an HTML-first SlexKit host.

1. Put standard HTML/SVG, optional `<style>`, documented `slex-*` elements, and optional inline module scripts inside a `slex` fence.
2. Never emit the removed object `g/layout` format, expression-string attributes, state-only blocks, or fallback syntax.
3. Use DOM properties and native events. Read the component manifest before using a custom element; use native HTML when no supported element exists.
4. Do not include component registration, runtime imports, stylesheet URLs, or setup assets in the payload. The host owns them.
5. Use the sandbox global `slex`: `root`, the scope `AbortSignal` at `signal`, `onDispose`, `onSnapshot`, `onRestore`, approved `api`, and `shared.get/set/subscribe`.
6. Give interactive elements stable `id` or `data-key` values. Register cleanup for listeners, timers, observers, and other side effects with `slex.onDispose`.
7. Keep hidden state snapshot logic explicit. Use `onSnapshot`/`onRestore` when closure state must survive a compatible update.
8. Do not use external scripts/imports, inline `on*` attributes, embedded frames/plugins, navigation metadata, or executable URL schemes.
9. Use only host-approved `slex.api` operations for network work. Payload resource loads are denied by the frame policy, but iframe self-navigation is not a complete egress barrier; do not call `fetch`, WebSocket, or direct network APIs.
10. Static validation is not a security sandbox. Generated code must remain in the isolated document, runtime load failure must fail closed, and hostile code still needs external network controls and CPU timeouts.

Supported custom elements are documented in `docs/web-components.md` and `dist/custom-elements.json`.
