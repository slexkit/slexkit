---
title: "Code Block"
category: Content
status: ready
order: 50
summary: "代码或配置片段展示。"
---
# Code Block 代码块

展示代码、配置或源码片段，支持语言标签和可选标题。

<!-- slex:spec-example:start component="code-block" id="basic" sourceHash="9c3453f7" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_code_block_typical",
  "layout": {
    "code-block:config": {
      "title": "配置",
      "icon": "code",
      "language": "js",
      "code": "export const enabled = true;"
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：代码示例、JSON 配置、命令行片段、日志输出。
- 不适合：可运行的 SlexKit 示例（应当用 `slex` fence 或 playground）。
- 关联组件：playground 提供可编辑的交互预览。
- 代码内容仅为展示用途，不支持编辑。

## API 参考 {#api}

<!-- slex:spec-api:start component="code-block" sourceHash="0cc54fab" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `code` | string | 否 | 是 |  | 代码文本内容。 |
| `source` | string | 否 | 是 |  | code 的别名。 |
| `content` | string | 否 | 是 |  | code 的别名。 |
| `language` | string | 否 | 否 |  | 语言标签。 |
| `title` | string | 否 | 否 |  | 代码块标题。 |
| `icon` | string | 否 | 否 |  | 显示在标题前的图标名称。 |
| `lineNumbers` | boolean | 否 | 否 | `true` | 显示行号。 |
<!-- slex:spec-api:end -->
