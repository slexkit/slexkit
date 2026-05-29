---
name: slexkit-author
description: Slash-command style `/author` skill for writing SlexKit display-oriented interactive UI as explicit Markdown `slex` fences with readable fallback.
---

# SlexKit Author

Use this skill as `/author` when creating display-oriented SlexKit output.

## Workflow

1. Prefer the `@slexkit/mcp` tools when available: call `slexkitDocs`, `slexkitExamples`, and `slexkitValidate`.
2. Read `/llms-authoring.txt` for authoring rules and `/llms-components.txt` for component props when MCP is unavailable.
3. Emit a fenced Markdown block tagged `slex`.
4. Use the envelope `{ namespace, g, layout }`.
5. Put state and helper logic in `g`; put component tree fields in `layout`.
6. Add Markdown fallback immediately after the fence.

## Rules

- Use display UI for summaries, status cards, metrics, calculators, progress, tables, and dashboards.
- Component keys must be `type:identifier`.
- Dynamic props use `$` read-pipes, for example `"$text": "g.done + ' done'"`.
- Event handlers use `on*` write-pipes, for example `onclick: "g.count++"`.
- Do not emit imports, JSX, Svelte, Vue, or app scaffolding.
- Do not ask hosts to scan plain JavaScript or JSON blocks.
- Do not use ToolHost unless the UI must return submitted or ignored structured data.
- Do not request `.mdx`; SlexKit raw docs are `.md` files with `slex` fences.

## Output Shape

````md
```slex
{
  namespace: "status",
  g: { done: 3, total: 4 },
  layout: {
    "card:summary": {
      title: "Status",
      "text:count": { "$text": "g.done + '/' + g.total + ' complete'" },
      "progress:bar": { "$value": "g.done / g.total * 100" }
    }
  }
}
```

**Status:** 3/4 complete.
````

Validate generated source before presenting it when a local parser or MCP tool is available.
