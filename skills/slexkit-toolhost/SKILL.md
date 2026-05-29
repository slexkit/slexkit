---
name: slexkit-toolhost
description: Slash-command style `/toolhost` skill for SlexKit confirmations, choices, and forms that return structured submitted or ignored results.
---

# SlexKit ToolHost

Use this skill as `/toolhost` when UI must return structured user input to the host.

## When To Use

Use ToolHost for:

- confirmations and approvals
- single or multi-choice option lists
- forms
- flows that must resolve a Promise with `submitted` or `ignored`

Do not use ToolHost for ordinary display-only status cards, dashboards, calculators, summaries, or metrics. Those should be `slex` fences.

## Workflow

1. Read `/llms-toolhost.txt` or call `slexkitDocs` through `@slexkit/mcp` with `group: "ToolHost"`.
2. Prefer built-in templates: `confirm-action`, `choose-options`, `option-list`, `fill-form`.
3. Use `renderToolCall(call, container)` for host rendering.
4. Await `handle.promise` and dispose the handle after completion.
5. For custom templates, compile a `ToolCall` into a `SlexExpression` and include a `submit:actions` boundary.

## Result Contract

Tool results resolve to:

```ts
{ toolName: string; status: "submitted"; value: Record<string, unknown> }
{ toolName: string; status: "ignored"; value: null }
```

Keep returned values small, explicit, and host-readable.
