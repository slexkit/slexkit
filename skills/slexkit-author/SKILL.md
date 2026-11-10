---
name: slexkit-author
description: Slash-command style `/author` skill for writing SlexKit display-oriented interactive UI as explicit Markdown `slex` fences with readable fallback.
---

# SlexKit Author

Use this skill as `/author` when creating display-oriented SlexKit output.

## Workflow

1. Prefer the `@slexkit/mcp` tools when available: call `slexkitDocs`, `slexkitExamples`, and `slexkitValidate`.
2. Read `/llms-authoring.txt` and `/llms-components.txt` when MCP is unavailable.
3. Emit one explicit Markdown fence tagged `slex` containing an HTML fragment.
4. Use documented custom elements, semantic native HTML/SVG, and ordinary inline JavaScript modules.
5. Add readable Markdown fallback immediately after the fence when the surrounding host supports it.

## Rules

- Follow the `html-1` profile. Never emit the removed object `g/layout` envelope, expression attributes, state-only blocks, or event statement strings.
- Use scalar attributes for initial values, live DOM properties for arrays/objects, native events for interaction, and slots for children.
- Query within `slex.root`; `slex.signal` is an `AbortSignal`, not a reactive signal factory.
- Give durable interactive nodes stable `id` or `data-key` values and clean up side effects with `slex.onDispose`.
- Use `slex.shared` only for JSON state shared within one artifact. Each fence remains a separate document.
- Do not emit runtime imports, component registration, external scripts, inline `on*` attributes, JSX, Svelte, Vue, or application scaffolding.
- Do not use ToolHost unless the UI must return an explicit submitted or ignored structured result.
- Keep static validation separate from runtime/browser verification.

## Output Shape

````md
```slex
<slex-card title="Status">
  <slex-stat id="count" label="Completed" value="3 / 4"></slex-stat>
  <slex-progress id="progress" label="Progress" value="75"></slex-progress>
</slex-card>
```

**Status:** 3/4 complete.
````

Validate generated source before presenting it when a local inspector or MCP tool is available. Validation must not execute payload scripts.
