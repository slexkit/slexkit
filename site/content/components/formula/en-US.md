---
title: "Formula"
category: Display
status: ready
order: 11
summary: "Reactive KaTeX formula display."
---
# Formula

Render SlexKit state and computed values through KaTeX. Use it when Markdown explains the model and the interactive block needs the formula itself to update.

<!-- slex:spec-example:start component="formula" id="basic" sourceHash="1578d25d" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_formula_typical",
  "g": {
    "r": 10000,
    "c": 100,
    "fc": 159.15
  },
  "layout": {
    "formula:cutoff": {
      "$tex": "'f_c = \\\\frac{1}{2\\\\pi RC} = ' + g.fc + '\\\\text{ Hz}'"
    }
  }
}
```
<!-- slex:spec-example:end -->

## Usage Notes

- Use for formulas whose variables come from SlexKit state.
- Keep the explanatory derivation in Markdown and use `formula` for the live expression.
- Use `displayMode: false` for inline formula fragments.
- Invalid TeX is rendered by KaTeX as an error expression instead of throwing.

## API Reference {#api}

<!-- slex:spec-api:start component="formula" sourceHash="144588e3" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| `tex` | string | No | Yes |  | KaTeX source to render. |
| `formula` | string | No | Yes |  | Alias for tex. |
| `value` | string | No | Yes |  | Alias for tex. |
| `displayMode` | boolean | No | No | `true` | Render as display math when true; inline math when false. |
| `display` | boolean | No | No | `true` | Alias for displayMode. |
| `block` | boolean | No | No | `true` | Alias for displayMode. |
<!-- slex:spec-api:end -->
