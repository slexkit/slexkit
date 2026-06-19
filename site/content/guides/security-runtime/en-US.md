---
title: Secure Runtime Setup
category: Guides
status: ready
order: 40
summary: "Decision and setup guide for rendering untrusted or agent-generated Slex source."
slexkitRenderMode: component
---

# Secure Runtime Setup

Use secure mode when the host does not fully control the Slex source: unreviewed user input, third-party Markdown, direct agent output, or shared documents where authorship is unclear.

Secure mode is a deployment and policy choice. The complete threat model, `HostRuntimePolicy`, sandbox attributes, bridge messages, and fail-closed behavior are specified in the [Security Runtime Contract](/docs/reference/security).

## Mode Decision

| Source | Recommended mode | Notes |
|---|---|---|
| Application-generated source | trusted | Lowest overhead; source is part of your app boundary. |
| Repository examples or reviewed snippets | trusted | Keep examples explicit and versioned. |
| Local Obsidian vault notes | trusted readonly | The Obsidian adapter is not a sandbox boundary. |
| User-submitted Markdown | secure | Treat source as untrusted even when the Markdown looks harmless. |
| Direct agent output | secure | Do not grant network, timer, animation, or canvas access by default. |

If the answer is unclear, start with secure mode and enable capabilities only after the host has a concrete product need.

## Minimal Host Setup

For Markdown hosts, prefer `createSlexKitMarkdownRuntimeHost`. It keeps artifact scoping, state-only fences, block cleanup, and secure-frame mounting in one place.

```ts
import { createSlexKitMarkdownRuntimeHost } from "slexkit";
import "slexkit/style.css";

const runtime = createSlexKitMarkdownRuntimeHost({
  mode: "secure",
  theme: "host-shadcn",
  secureFrame: {
    runtimeUrl: "/slexkit.runtime.js"
  },
  policy: {
    execution: {
      heartbeatIntervalMs: 1000,
      maxUnresponsiveMs: 30000
    }
  }
});

export function mountSlexFence(source: string, container: HTMLElement) {
  return runtime.mountBlock({
    artifactId: "message-42",
    source,
    container
  });
}
```

Call `disposeBlock(container)` when a fence disappears, and call `disposeArtifact(artifactId)` when the full message, document, or note is destroyed.

Omitted capability policies deny access by default. Add `network`, `timer`, `animation`, or `canvas` policy objects only when the host intentionally enables those capabilities.

## Runtime Module

The secure iframe imports the runtime from `secureFrame.runtimeUrl`. Serve that file as a public ES module:

```http
Access-Control-Allow-Origin: *
Content-Type: text/javascript
```

This is server or deployment configuration. It cannot be repaired from frontend JavaScript after the request has already failed.

## Policy Checklist

- Keep network disabled unless a specific product feature needs it.
- If network is enabled, allow only required methods, origins, headers, body sizes, response sizes, and content types.
- Keep timers, animation, and canvas disabled unless the Slex source needs them.
- Never treat `capabilities`, `permissions`, `api`, or similar fields inside Slex source as authorization.
- Do not add `allow-same-origin` to solve CORS or debugging issues.
- Keep unresponsive runtime failures visible to users through the built-in fail-closed diagnostic.

For exact policy fields and allowed adapter hooks, use the [Security Runtime Contract](/docs/reference/security).

## Host Boundaries

`@slexkit/streamdown` can run trusted or secure. Use secure mode for chat messages and agent output unless the message source is already trusted by the host.

The official Obsidian plugin is a trusted readonly adapter for local vault content. It should not be used as the isolation boundary for third-party Markdown or direct agent output.

Custom Markdown hosts should still process only fences whose language is exactly `slex` and should preserve readable Markdown fallback for non-SlexKit environments.

## Production Checklist

- Stable `artifactId` per message, document, or note
- Explicit `slex` fence detection only
- Public `slexkit.runtime.js` module with CORS and JavaScript content type
- Deny-by-default host policy
- Cleanup on block removal and artifact destruction
- Visible fallback text after each interactive fence
- Link to the reference contract for policy, bridge, CSP, and sandbox details
