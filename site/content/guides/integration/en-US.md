---
title: Integration
category: Guides
status: ready
order: 25
summary: "Connect SlexKit to assistant-ui, Streamdown, Tiptap, Obsidian, or a custom Markdown renderer."
slexkitRenderMode: component
---

# Integration

All adapters feed raw HTML fence strings into `createSlexKitMarkdownRuntimeHost`. They preserve the existing `updateArtifact(artifactId, blocks, { phase, reset? })` lifecycle and stable IDs.

Hosts own component registration, `runtimeUrl`, optional `styleUrl`, capability policy, and artifact identity. Payloads do not import the runtime or register elements. Missing frame assets fail closed. Ordinary Markdown remains outside this lifecycle.

Streamdown, assistant-ui, Tiptap, Svelte Markdown, and note-host integrations must use the same isolated document host rather than pre-evaluating source.
