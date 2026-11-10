---
name: slexkit-secure-runtime
description: Slash-command style `/secure` skill for configuring SlexKit iframe isolation, host policy, runtime assets, and fail-closed behavior.
---

# SlexKit Secure Runtime

Use this skill as `/secure` when a host renders unreviewed or agent-generated SlexKit HTML.

## Workflow

1. Read `/llms-runtime.txt` or call `slexkitDocs` through `@slexkit/mcp` with the security/runtime reference group.
2. Use `createSlexKitMarkdownRuntimeHost`; every mode uses its sandboxed opaque-origin iframe path.
3. Serve `slexkit.runtime.js` as a self-contained ES module and configure optional style/font/image assets explicitly.
4. Configure a minimal host policy for approved `slex.api` capabilities.
5. Dispose runtime artifacts when their owning Markdown block or message is removed.

## Rules

- Never run generated source in the host realm. Shadow DOM is not a security boundary.
- Keep fail-closed behavior. If runtime boot, asset loading, message validation, or static inspection fails, show fallback/diagnostics instead of executing elsewhere.
- Static inspection never executes payload code and does not prove it safe.
- Supported-browser checks deny payload fetch/image/font/external script/link resource loads, but iframe self-navigation can still issue a network request. Add external network controls for hostile code.
- SlexKit does not preempt arbitrary computation. Add an external browser/process timeout where CPU denial of service is in scope.

## Checks

- `runtimeUrl` points to the built runtime module; optional `styleUrl`, font URLs, and image URLs are host-owned.
- CORS and content type permit ES module loading in the opaque-origin iframe.
- Host policy is minimal and approved bridge calls are distinguished from direct browser behavior.
- Fallback Markdown remains readable if isolated rendering fails.
