---
name: slexkit-host-integration
description: Slash-command style `/host` skill for integrating SlexKit into Markdown renderers, chat hosts, Streamdown, note hosts, or custom adapters.
---

# SlexKit Host Integration

Use this skill as `/host` when adding SlexKit to a host application or documentation renderer.

## Workflow

1. Read `/llms-runtime.txt` or call `slexkitDocs` through `@slexkit/mcp` with the runtime/reference group.
2. Process only explicitly tagged `slex` fences and pass their raw HTML strings to `createSlexKitMarkdownRuntimeHost`.
3. Assign stable artifact and block IDs, and map streaming preview/commit states to `updateArtifact(artifactId, blocks, { phase, reset? })`.
4. Serve the self-contained `slexkit.runtime.js` ES module and optional `slexkit.css` with CORS suitable for an opaque-origin iframe.
5. Dispose blocks/artifacts with their owning Markdown nodes and preserve readable fallback in unsupported environments.

## Integration Paths

- Vanilla host: `createSlexKitMarkdownRuntimeHost` or `mount`.
- React/Streamdown: `@slexkit/streamdown`.
- assistant-ui: `@slexkit/assistant-ui`.
- Tiptap: `@slexkit/tiptap`.
- Custom host: detect the fence, pass source plus identity to the document host, and dispose it when removed.

## Rules

- Every payload follows the isolated document path. `mode: "trusted"` and `trusted: true` are compatibility inputs only; they do not enable host-realm execution.
- The host owns `runtimeUrl`, optional `styleUrl`, component registration, theme assets, capability policy, and artifact identity.
- Do not scan arbitrary JavaScript, JSON, or untagged code blocks, and do not pre-evaluate fence source.
- Keep ToolHost separate from ordinary display fence rendering.
- Treat static inspection as non-executing syntax/policy checking, not as the isolation boundary.
- The frame policy is not a universal egress firewall and does not provide CPU preemption; hostile execution needs external browser/process controls and timeouts.
