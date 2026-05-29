---
name: slexkit-secure-runtime
description: Slash-command style `/secure` skill for configuring SlexKit secure runtime, sandbox iframe isolation, host policy, and fail-closed behavior.
---

# SlexKit Secure Runtime

Use this skill as `/secure` when rendering untrusted or agent-generated Slex source.

## Workflow

1. Read `/llms-runtime.txt` or call `slexkitDocs` through `@slexkit/mcp` with `group: "Security"` or `group: "Runtime"`.
2. Use secure runtime mode for untrusted source.
3. Serve `slexkit.runtime.js` as a public ES module.
4. Configure host policy for sensitive capabilities.
5. Keep the iframe sandboxed with an opaque origin.
6. Dispose runtime artifacts when the owning Markdown block or message is removed.

## Rules

- Do not run untrusted source in the host realm.
- Do not grant network, timers, canvas, or host APIs unless the host policy explicitly allows them.
- Do not use security as a parser substitute: still process only explicit `slex` fences.
- Keep fail-closed behavior. If runtime boot, heartbeat, policy, or parse validation fails, show fallback or diagnostics instead of executing in trusted mode.

## Checks

- `runtimeUrl` points to the built runtime module.
- CORS and content type are correct for ES module loading.
- Host policy is minimal.
- Fallback Markdown remains readable if secure rendering fails.
