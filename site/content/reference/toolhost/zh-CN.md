---
title: ToolHost
category: Reference
status: ready
order: 70
summary: "用于 confirmations、choices、forms、templates 与 submit boundaries 的结构化用户输入 UI。"
slexkitRenderMode: component
---

# ToolHost

ToolHost 把 AI tool calls 连接到浏览器中的交互 UI。AI 不直接在 server-side 执行工具，而是渲染结构化输入表单，并把用户响应作为 `ToolResult` 返回。

## Concepts

当 AI model 发出 tool call（例如 `confirm-action`、`fill-form`）时，ToolHost 会把它编译成标准 `SlexExpression` 并通过 core runtime 挂载。挂载后的 UI 通过 `submit:actions` 组件形成 submit boundary，并用用户输入 resolve Promise。

ToolHost 与 display-oriented `slex` fences 分离。Display components 展示信息；ToolHost components 收集结构化输入并以编程方式返回。

## Public API

### `renderToolCall(call, container) -> ToolRenderHandle`

渲染 tool call 并返回 handle：

```ts
const handle = renderToolCall({
  template: "confirm-action",
  args: {
    title: "Delete item?",
    description: "This cannot be undone.",
    confirmLabel: "Delete",
    cancelLabel: "Cancel"
  }
}, container);

const result = await handle.promise;
```

`ToolRenderHandle` 包含 `promise: Promise<ToolResult>` 与 `dispose()`。用户提交或忽略时 promise resolve；取消或卸载时调用 `dispose()` 清理 DOM。

### `registerToolTemplate(name, compiler)`

注册自定义 template compiler。Compiler 接收 tool args，返回标准 Slex source。

```ts
registerToolTemplate("review-choice", (args) => ({
  namespace: "tool_review_choice",
  layout: {
    "card:review": {
      title: String(args.title ?? "Review"),
      "submit:actions": {
        options: [
          { label: "Approve", value: "approve" },
          { label: "Request changes", value: "changes" }
        ]
      }
    }
  }
}));
```

## Built-in templates

### `confirm-action`

用于 yes/no 或 destructive confirmation。

常用 args：

| Field | Description |
|---|---|
| `title` | 标题 |
| `description` | 说明文本 |
| `confirmLabel` | 确认按钮 |
| `cancelLabel` | 取消按钮 |
| `tone` | `info`、`warning`、`danger` 等语义 tone |

Result 通常包含用户选择的 action value。

### `choose-options` / `option-list`

用于单选、多选或较长列表选择。

```ts
renderToolCall({
  template: "choose-options",
  args: {
    title: "Pick deploy target",
    multiple: false,
    options: [
      { label: "Preview", value: "preview" },
      { label: "Production", value: "production" }
    ]
  }
}, container);
```

Options 应包含 stable `value`，visible `label`，以及可选 description 或 metadata。`option-list` 适合更长、更需要滚动的列表。

### `fill-form`

用于结构化表单输入。

```ts
renderToolCall({
  template: "fill-form",
  args: {
    title: "Create release",
    fields: [
      { name: "version", label: "Version", type: "text", required: true },
      { name: "notes", label: "Notes", type: "textarea" }
    ],
    submitLabel: "Create"
  }
}, container);
```

Fields 使用稳定 `name` 作为结果 key。表单 template 应保持 schema 简洁，避免把复杂业务逻辑塞进 tool call args。

## Writing a custom template

Custom template 的职责是把 tool args 转成普通 Slex source。Template 不应绕过 runtime security model，也不应把 display UI 强行变成 tool result。

推荐模式：

- Validate 或 normalize args。
- 生成明确 namespace。
- 使用标准 components 组成 UI。
- 使用 `submit` component 作为唯一 completion boundary。
- 在 result 中返回结构化、可序列化数据。

### Key patterns

- Display UI 不应使用 `submit`。
- ToolHost template 可以复用普通 components，但必须有明确 submit boundary。
- 用户取消、容器卸载或 host teardown 时必须 cleanup。
- 不可信 tool args 应按 host 的 trust policy 处理。
