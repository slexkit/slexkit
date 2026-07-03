---
title: "Formula 公式"
category: Display
status: ready
order: 11
summary: "响应式 KaTeX 公式显示。"
---
# Formula 公式

把 SlexKit 状态和计算结果交给 KaTeX 渲染。适合 Markdown 负责解释推导，交互块负责修改变量，并让公式本身同步更新的场景。

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

## 使用提示

- 适合：公式变量来自 SlexKit 状态，且公式需要随交互更新。
- 不适合：纯静态公式，直接写 Markdown KaTeX 更简单。
- Markdown 负责推导说明，`formula` 负责实时公式表达。
- `displayMode: false` 可用于行内公式片段。

## API 参考 {#api}

<!-- slex:spec-api:start component="formula" sourceHash="144588e3" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `tex` | string | 否 | 是 |  | 要渲染的 KaTeX 源码。 |
| `formula` | string | 否 | 是 |  | tex 的别名。 |
| `value` | string | 否 | 是 |  | tex 的别名。 |
| `displayMode` | boolean | 否 | 否 | `true` | 为 true 时渲染为块级公式；为 false 时渲染为行内公式。 |
| `display` | boolean | 否 | 否 | `true` | displayMode 的别名。 |
| `block` | boolean | 否 | 否 | `true` | displayMode 的别名。 |
<!-- slex:spec-api:end -->
