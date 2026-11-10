---
title: Host Integration
category: Reference
status: ready
order: 40
summary: "HTML document host integration for Streamdown, assistant-ui, Tiptap, note hosts, and custom adapters."
slexkitRenderMode: component
---

# Host Integration

All adapters feed raw HTML fence strings into `createSlexKitMarkdownRuntimeHost`. They preserve the existing `updateArtifact(artifactId, blocks, { phase, reset? })` lifecycle and stable IDs.

Hosts own component registration, `runtimeUrl`, optional `styleUrl`, capability policy, and artifact identity. Payloads do not import the runtime or register elements. Missing frame assets fail closed. Ordinary Markdown remains outside this lifecycle.

`mode: "trusted"` and `trusted: true` are accepted only for compatibility. `getMode()` reports `"secure"`, and every payload still executes in an isolated document.

Streamdown, assistant-ui, Tiptap, Svelte Markdown, and note-host integrations must use the same isolated document host rather than pre-evaluating source.
