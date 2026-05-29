---
title: "Playground"
category: Tooling
status: ready
order: 10
summary: "SlexKit / Markdown 的交互预览和编辑器。"
---
# Playground 操场

SlexKit 的交互预览组件，可在页面内嵌入可编辑、可运行的 SlexKit 或 Markdown 源码预览。

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

## 使用提示

- 适合：文档中的可运行示例、交互式演示、源码教学。
- 不适合：普通组件渲染（应当直接使用 layout 中的组件）。
- 关联组件：code-block 用于只读代码展示。
- 嵌套的 source 会被隔离渲染，不会与父级 namespace 冲突。
- Playground 是用于文档和教学的工具组件，不作为产品 UI 的组成单元。
- 公开字段覆盖源码解析、预览位置、主题切换控件、按钮文案以及打开/复制 URL。
- `domain`、`pluginVersion`、`version` 是宿主集成元数据，不作为公开组件 API。

## API 参考 {#api}

<!-- slex:spec-api:start component="playground" sourceHash="beb5402a" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `source` | object \| string | 否 | 否 |  | 要预览的 SlexKit 或 Markdown 源码。 |
| `sourceType` | string: slex, markdown, auto-markdown | 否 | 否 | `"slex"` | 源码解析模式。 |
| `title` | string | 否 | 否 |  | Playground 标题。 |
| `previewAlign` | string: center, start | 否 | 否 | `"center"` | 渲染模式下预览区域的垂直对齐。 |
| `alignPreview` | string: center, start | 否 | 否 |  | previewAlign 的别名。 |
| `previewPlacement` | string: center, start | 否 | 否 |  | previewAlign 的别名。 |
| `previewMinHeight` | string | 否 | 否 |  | 预览区域最小高度。 |
| `previewMaxWidth` | string | 否 | 否 |  | 预览内容最大宽度。 |
| `themeToggle` | boolean | 否 | 否 | `false` | 显示主题切换操作。 |
| `showThemeToggle` | boolean | 否 | 否 | `false` | themeToggle 的别名。 |
| `enableThemeToggle` | boolean | 否 | 否 | `false` | themeToggle 的别名。 |
| `themeLabel` | string | 否 | 否 |  | 主题切换操作的无障碍标签。 |
| `themeToggleLabel` | string | 否 | 否 |  | themeLabel 的别名。 |
| `sourceTypeLabel` | string | 否 | 否 |  | 源码类型选择器的无障碍标签。 |
| `copyLabel` | string | 否 | 否 |  | 复制源码操作的无障碍标签。 |
| `openWebLabel` | string | 否 | 否 |  | 在独立 Playground 中打开源码操作的无障碍标签。 |
| `webUrl` | string | 否 | 否 |  | 打开操作使用的独立 Playground URL。 |
| `playgroundUrl` | string | 否 | 否 |  | webUrl 的别名。 |
<!-- slex:spec-api:end -->
