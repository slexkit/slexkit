# SlexKit Agent Rules

Use these rules when an AI agent writes or integrates SlexKit.

## Output Shape

- Use explicit `slex` fenced code blocks for display-oriented interactive UI.
- Include a readable Markdown fallback after every generated fence.
- Use the Slex envelope `{ namespace, g, layout }`.
- Keep state, derived values, and helper functions in `g`.
- Keep component structure in `layout`.
- Use component keys in `type:identifier` form.
- Use `$` read-pipes for dynamic props and `on*` write-pipes for event handlers.

## Boundaries

- Do not emit React, JSX, Svelte, Vue, imports, or build scaffolding inside `slex` fences.
- Do not ask a host to scan plain JavaScript, JSON, or untagged code blocks.
- Use ToolHost only for structured user input that must resolve to a submitted or ignored result.
- Use ordinary `slex` fences for status cards, dashboards, calculators, metrics, and summaries.
- Use the secure runtime for untrusted or agent-generated source.

## Discovery

- Read `/llms.txt` first for the short index.
- Read `/llms-components.txt` before choosing component props.
- Read `/llms-runtime.txt` before host integration.
- Read `/llms-toolhost.txt` before building confirmations, choices, or forms.
- Prefer the `@slexkit/mcp` read-only MCP server when available.
