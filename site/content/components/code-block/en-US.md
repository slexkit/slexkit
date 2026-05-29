---
title: "Code Block"
category: Content
status: ready
summary: "Code or configuration snippet display."
---
# Code Block

Display code, configuration, or source snippets with a language label and optional title.

<!-- slex:spec-example:start component="code-block" id="basic" sourceHash="9c3453f7" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_code_block_typical",
  "layout": {
    "code-block:config": {
      "title": "Config",
      "icon": "code",
      "language": "js",
      "code": "export const enabled = true;"
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for code samples, JSON config, CLI snippets, and log output.
- Not suitable for runnable SlexKit examples (use `slex` fence or `playground`).
- Related components: `playground` for editable interactive previews.
- Code content is display-only; editing is not supported.

## API Reference {#api}

<!-- slex:spec-api:start component="code-block" sourceHash="0cc54fab" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `code` | string | No | Yes |  | Code text content. |
| `source` | string | No | Yes |  | Alias for code. |
| `content` | string | No | Yes |  | Alias for code. |
| `language` | string | No | No |  | Language label. |
| `title` | string | No | No |  | Code block title. |
| `icon` | string | No | No |  | Icon name shown before the title. |
| `lineNumbers` | boolean | No | No | `true` | Show line numbers. |
<!-- slex:spec-api:end -->
