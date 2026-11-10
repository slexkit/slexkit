---
title: AI / Agents
category: Guides
status: ready
order: 50
summary: "LLM docs, MCP server, skills, and authoring rules for SlexKit agents."
slexkitRenderMode: component
---

# AI / Agents

Agents should read `AGENTS.slexkit.md`, `docs/html-migration-contract.md`, `docs/web-components.md`, and `dist/custom-elements.json`. Generate standard HTML and JavaScript in explicit `slex` fences.

Do not emit object `g/layout` source, expression attributes, runtime imports, registration calls, external scripts, or unsupported tags. Use `slex.root`, the scope `AbortSignal` at `slex.signal`, `slex.onDispose`, explicit snapshot hooks, approved `slex.api`, and JSON-only `slex.shared`. MCP validation is static and never executes payload code.

Use scalar attributes and slots for a static fragment:

```slex
<slex-card title="Build status" tone="success">
  <slex-row gap="3" align="center">
    <slex-badge text="Ready" tone="success"></slex-badge>
    <slex-link text="Read the AI index" href="/llms.txt"></slex-link>
  </slex-row>
</slex-card>
```

Assign arrays through live properties and listen for native events in an inline module. `slex.signal` is the current scope's `AbortSignal`; it is not a signal factory and is never called with an initial value.

```slex
<slex-select id="format" label="Format"></slex-select>
<slex-text id="selection" text="Choose a format"></slex-text>
<script type="module">
  const format = slex.root.querySelector("#format");
  const selection = slex.root.querySelector("#selection");
  format.options = [
    { value: "html", label: "HTML" },
    { value: "markdown", label: "Markdown" }
  ];
  format.addEventListener("change", () => {
    selection.text = `Selected: ${format.value}`;
  }, { signal: slex.signal });
</script>
```

Generated source must remain inert during static inspection. Runtime code executes only after the isolated document host commits it.
