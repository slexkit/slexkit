---
title: "Tabs"
category: Navigation
status: ready
order: 10
summary: "同一上下文内切换视图。"
---
# Tabs 选项卡

选项卡切换，支持水平和垂直方向。

<!-- slex:spec-example:start component="tabs" id="basic" sourceHash="df3a28e8" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_tabs_typical",
  "layout": {
    "tabs:main": {
      "value": "overview",
      "tabs": [
        {
          "value": "overview",
          "label": "Overview"
        },
        {
          "value": "settings",
          "label": "Settings"
        }
      ]
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：设置面板分区、内容分类切换、配置分组。
- 不适合：跨页面流程向导；这类场景应使用明确的页面状态和导航。
- 关联组件：button 用于提交动作，link 用于跨页面跳转。
- 使用 $value 和 onchange 实现受控切换。

### orientation 变体

```slex
{
  namespace: "doc_tabs_orientation_diff",
  layout: {
    "row:orientations": {
      "column:h": {
        "text:horiz": {
          text: "horizontal (default)"
        },
        "tabs:horizontal": {
          value: "a",
          orientation: "horizontal",
          tabs: [
            {
              value: "a",
              label: "Tab A"
            },
            {
              value: "b",
              label: "Tab B"
            }
          ]
        }
      },
      "column:v": {
        "text:vert": {
          text: "vertical"
        },
        "tabs:vertical": {
          value: "a",
          orientation: "vertical",
          tabs: [
            {
              value: "a",
              label: "Tab A"
            },
            {
              value: "b",
              label: "Tab B"
            }
          ]
        }
      }
    }
  }
}
```

## API 参考 {#api}

<!-- slex:spec-api:start component="tabs" sourceHash="a8288681" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `value` | string | 否 | 是 |  | 当前激活的 tab 值。 |
| `tabs` | array | 否 | 否 |  | Tab 定义，包含 value、label、content、icon 和 iconOnly。 |
| `tabs[].icon` | string | 否 | 否 |  | 显示在 tab 触发标签前的图标名称。 |
| `tabs[].iconOnly` | boolean | 否 | 否 |  | 只显示 tab 图标，同时保留标签作为无障碍文本。 |
| `orientation` | string: horizontal, vertical | 否 | 否 | `"horizontal"` | Tab 列表方向。 |
| `onchange` | write-expression | 否 | 否 |  | 激活 tab 变化时执行的写表达式。 |
<!-- slex:spec-api:end -->
