---
title: "Submit"
category: Action
status: ready
order: 20
summary: "ToolHost 提交控件，把当前选择或表单值返回宿主。"
---
# Submit 提交按钮

ToolHost 的提交控件，提供提交/忽略两个操作。

<!-- slex:spec-example:start component="submit" id="basic" sourceHash="b5d89128" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_submit_typical",
  "layout": {
    "column:tool": {
      "input:title": {
        "value": "Release note",
        "placeholder": "标题"
      },
      "submit:done": {
        "submitLabel": "提交",
        "ignoreLabel": "忽略",
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

- 适合：AI 工具链的确认表单、参数设置面板、选择确认流程。
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
