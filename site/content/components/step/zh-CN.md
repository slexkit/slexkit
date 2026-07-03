---
title: "ToolHost Step"
category: Tooling
status: ready
order: 21
summary: "ToolHost 专用步骤页，用于在一次 function call 里逐步收集多段用户输入。"
---
# ToolHost Step

`step` 是 ToolHost 模板内部的步骤页，用来把一个 function call 里的多个输入段拆成逐页确认。它和 `submit` 一样不是普通公开组件，不应该出现在 display fence 或组件示例里。

典型用途是：agent 发起一次需要人工输入的 function call，ToolHost 渲染一张 Slex 卡片；卡片内部根据状态切换当前 `step`，先显示“发布策略”，再显示“工程约束”，最后用 `submit:actions` 一次性返回结构化结果。

<!-- slex:spec-example:start component="step" id="basic" sourceHash="86ba4567" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_step_toolhost",
  "layout": {
    "step:strategy": {
      "title": "Release strategy",
      "index": 1,
      "radio-group:choice": {
        "options": [
          {
            "label": "Canary",
            "value": "canary"
          },
          {
            "label": "Full",
            "value": "full"
          }
        ]
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：ToolHost 表单里的逐步提问、审批参数面板、多段人工输入。
- 不适合：普通页面导航、公开组件 demo、display-only 内容。
- 与 `submit` 配合使用；`step` 只负责当前页结构，最终提交仍由 `submit:actions` 负责。

## API 参考 {#api}

<!-- slex:spec-api:start component="step" sourceHash="73e9bde2" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `title` | string | 否 | 否 |  | Step title. |
| `description` | string | 否 | 否 |  | Short helper text for the step. |
| `index` | string \| number | 否 | 否 |  | Visible step number. |
| `total` | string \| number | 否 | 否 |  | Total step count shown with index. |
| `progress` | string | 否 | 否 |  | Explicit progress label, such as 1/2. |
| `state` | string | 否 | 否 |  | Optional visual state such as current or completed. |
| 子组件 | object | 否 | 否 |  | 嵌套组件字段会按字段顺序渲染为子内容。 |
<!-- slex:spec-api:end -->
