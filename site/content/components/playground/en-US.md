---
title: "Playground"
category: Tooling
status: ready
order: 10
summary: "Interactive preview and editor for SlexKit / Markdown source."
---
# Playground

Interactive preview component that embeds editable, runnable SlexKit or Markdown source previews inside a page.

<!-- slex:spec-example:start component="playground" id="basic" sourceHash="bccf9e4b" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_playground_typical",
  "layout": {
    "playground:demo": {
      "title": "Stat Playground",
      "previewMinHeight": "180px",
      "source": {
        "namespace": "inner_stat_demo",
        "layout": {
          "stat:value": {
            "label": "Requests",
            "value": "1.2k",
            "unit": "/min"
          }
        }
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for runnable examples in documentation, interactive demos, and source code teaching.
- Not suitable for ordinary component rendering (use layout components directly).
- Related components: `code-block` for read-only code display.
- Nested source is rendered in an isolated scope — it does not conflict with the parent namespace.
- Use Playground for documentation and teaching surfaces, not product UI.
- Public fields cover source parsing, preview placement, theme toggle controls, labels, and open/copy URLs.
- `domain`, `pluginVersion`, and `version` are host integration metadata, not public component fields.

## API Reference {#api}

<!-- slex:spec-api:start component="playground" sourceHash="beb5402a" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `source` | object \| string | No | No |  | SlexKit or Markdown source to preview. |
| `sourceType` | string: slex, markdown, auto-markdown | No | No | `"slex"` | Source parser mode. |
| `title` | string | No | No |  | Playground title. |
| `previewAlign` | string: center, start | No | No | `"center"` | Vertical preview alignment in render mode. |
| `alignPreview` | string: center, start | No | No |  | Alias for previewAlign. |
| `previewPlacement` | string: center, start | No | No |  | Alias for previewAlign. |
| `previewMinHeight` | string | No | No |  | Minimum preview area height. |
| `previewMaxWidth` | string | No | No |  | Maximum preview content width. |
| `themeToggle` | boolean | No | No | `false` | Show the theme toggle action. |
| `showThemeToggle` | boolean | No | No | `false` | Alias for themeToggle. |
| `enableThemeToggle` | boolean | No | No | `false` | Alias for themeToggle. |
| `themeLabel` | string | No | No |  | Accessible label for the theme toggle action. |
| `themeToggleLabel` | string | No | No |  | Alias for themeLabel. |
| `sourceTypeLabel` | string | No | No |  | Accessible label for the source type selector. |
| `copyLabel` | string | No | No |  | Accessible label for the copy source action. |
| `openWebLabel` | string | No | No |  | Accessible label for opening the source in the standalone playground. |
| `webUrl` | string | No | No |  | Standalone playground URL used by the open action. |
| `playgroundUrl` | string | No | No |  | Alias for webUrl. |
<!-- slex:spec-api:end -->
