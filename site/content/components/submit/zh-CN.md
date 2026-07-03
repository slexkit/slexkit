---
title: "Submit"
category: Tooling
status: ready
order: 20
summary: "ToolHost 专用提交动作，把当前选择或表单值返回宿主。"
---
# Submit 提交

`submit` 是 ToolHost 模板里的提交动作，负责把 `returnKeys` 指定的状态字段提交给宿主。它不是普通按钮组件；普通交互请使用 `button`。

<!-- slex:spec-example:start component="submit" id="basic" sourceHash="b5d89128" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_submit_typical",
  "layout": {
    "column:tool": {
      "input:title": {
        "value": "Release note",
        "placeholder": "Title"
      },
      "submit:done": {
        "submitLabel": "Submit",
        "ignoreLabel": "Ignore",
        "returnKeys": [
          "title"
        ]
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：ToolHost 的确认表单、参数设置面板、选择确认流程。
- 不适合：普通操作按钮（应当用 button）。
- 关联组件：button 用于本地操作触发。
- 与 input、select 等输入组件配合使用读取用户选择。
- returnKeys 中的路径从全局状态 g 中读取。

## API 参考 {#api}

<!-- slex:spec-api:start component="submit" sourceHash="1c7c766f" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `submitLabel` | string | 否 | 否 | `"Submit"` | 提交按钮文本。 |
| `ignoreLabel` | string | 否 | 否 | `"Ignore"` | 忽略按钮文本。 |
| `returnKeys` | string[] | 否 | 否 |  | 返回给 ToolHost 的状态字段路径。 |
| `disabled` | boolean | 否 | 是 | `false` | 禁用提交操作。 |
<!-- slex:spec-api:end -->
