---
title: "Icon"
category: Component
status: ready
order: 10
summary: "所有支持 icon 字段的组件共享的图标管理能力。"
---
# Icon 图标

图标不是独立的布局组件，而是组件字段能力。支持 `icon` 的组件会通过全局图标管理器解析图标名，并把 SVG 放入组件自己的视觉位置。

<!-- slex:spec-example:start component="icon" id="basic" sourceHash="5fce5080" -->
```slex
{
  "slex": "0.1",
  "namespace": "spec_button_basic",
  "layout": {
    "button:demo": {
      "label": "设置",
      "icon": "gear-six",
      "iconOnly": true,
      "variant": "ghost"
    }
  }
}
```
<!-- slex:spec-example:end -->

## 支持组件

| 组件 | 支持字段 | 说明 |
| --- | --- | --- |
| accordion | `items[].icon` | 在单个折叠项 trigger 的 label 前显示图标。 |
| badge | `icon` | 在 badge 文本前显示图标。 |
| button | `icon`、`iconOnly` | 在按钮文本前显示图标；`iconOnly: true` 时只显示图标，但仍应提供 `label`。 |
| callout | `icon` | 在 callout 标题前显示图标。 |
| card | `icon` | 在 card 标题前显示图标。 |
| checkbox | `icon` | 在 checkbox 可见 label 前显示图标。 |
| code-block | `icon` | 在代码块标题前显示图标。 |
| collapsible | `icon` | 在 collapsible trigger 文本前显示图标。 |
| divider | `icon` | 在带 label 的分隔条文本前显示图标。 |
| link | `icon` | 在链接文本前显示图标。 |
| progress | `icon` | 在进度条 label 前显示图标。 |
| radio-group | `icon`、`options[].icon` | 在分组 label 和单个选项 label 前显示图标。 |
| section | `icon` | 在 section 标题前显示图标。 |
| select | `icon`、`options[].icon` | `icon` 装饰顶部 label；`options[].icon` 装饰菜单选项和已选值。 |
| slider | `icon` | 在 slider label 前显示图标。 |
| stat | `icon` | 在指标 label 前显示图标。 |
| switch | `icon` | 在 switch 可见 label 前显示图标。 |
| table | `columns[].icon` | 在表头列 label 前显示图标。 |
| tabs | `tabs[].icon`、`tabs[].iconOnly` | 在每个 tab trigger 中显示图标；选中项会请求激活态图标。 |
| toast | `icon` | 替换 toast 左侧语义标记为图标，仍继承 tone 色彩。 |

`playground` 的顶部操作按钮内部复用 button，所以它会受益于同一套图标管理器，但它本身没有对外暴露通用 `icon` 字段。`select` 的下拉箭头是固定控件指示器，`select.icon` 只装饰顶部 label，不替换下拉箭头。

## 名称解析

无前缀图标名默认使用 Iconify 的 `ph` 集合，也就是 Phosphor 图标。

```slex
{
  namespace: "doc_icon_names",
  layout: {
    "row:icons": {
      "button:chart": {
        label: "图表",
        icon: "ChartBar"
      },
      "button:copy": {
        label: "复制",
        icon: "lucide:copy",
        variant: "secondary"
      },
      "button:settings": {
        label: "设置",
        icon: "gear-six",
        iconOnly: true,
        variant: "ghost"
      }
    }
  }
}
```

常用写法：

| 写法              | 解析结果                                 |
| ----------------- | ---------------------------------------- |
| `ChartBar`        | `ph:chart-bar`                           |
| `chart-bar`       | `ph:chart-bar`                           |
| `ph:chart-bar`    | Phosphor / Iconify 的 `ph` 集合          |
| `lucide:copy`     | Iconify 的 `lucide` 集合                 |
| `brand:logo-mark` | 宿主通过 `registerIcon` 注册的自定义图标 |

## Tabs 图标

```slex
{
  namespace: "doc_icon_tabs",
  layout: {
    "tabs:main": {
      value: "overview",
      tabs: [
        {
          value: "overview",
          label: "概览",
          icon: "ChartBar"
        },
        {
          value: "activity",
          label: "活动",
          icon: "pulse"
        },
        {
          value: "settings",
          label: "设置",
          icon: "Gear",
          iconOnly: true
        }
      ]
    }
  }
}
```

## 标签和标题图标

```slex
{
  namespace: "doc_icon_labels",
  layout: {
    "column:demo": {
      "callout:notice": {
        title: "提示",
        icon: "info",
        text: "带标题的组件也使用同一个 icon 字段。"
      },
      "accordion:faq": {
        value: "install",
        items: [
          {
            value: "install",
            label: "安装",
            icon: "download-simple",
            content: "准备依赖。"
          },
          {
            value: "review",
            label: "复核",
            icon: "check-circle",
            content: "验证结果。"
          }
        ]
      },
      "select:env": {
        label: "环境",
        icon: "server",
        value: "prod",
        options: [
          { label: "开发环境", value: "dev", icon: "code" },
          { label: "生产环境", value: "prod", icon: "rocket-launch" }
        ]
      },
      "radio-group:mode": {
        label: "模式",
        icon: "sliders-horizontal",
        value: "auto",
        options: [
          { label: "自动", value: "auto", icon: "sparkle" },
          { label: "手动", value: "manual", icon: "wrench" }
        ]
      }
    }
  }
}
```

## 自定义图标

宿主可以在挂载内容前注册自己的 SVG 图标。注册后，所有支持 `icon` 字段的组件都能使用同一套名称。

```js
import { registerIcon, registerIcons } from "slexkit";

registerIcon(
  "brand:logo-mark",
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1 15 15H1L8 1Z"/></svg>',
  { aliases: ["logo-mark"] },
);

registerIcons({
  "status:healthy":
    '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/></svg>',
});
```

## 使用规则

- `iconOnly` 只适用于 button 和 tabs；标题、label、表头图标不会隐藏文字。
- `iconOnly` 必须配合 `label`、`title` 或 `aria-label`，否则辅助技术没有可读名称。
- 不传前缀时优先按 Phosphor 语义选择图标；跨图标集时使用显式前缀，例如 `lucide:copy`。
- 运行时不会接受任意 URL 作为图标源；在线图标通过 Iconify API 获取，返回的 SVG 会经过基础过滤。
- 首屏本地已打包图标会同步显示；未打包图标会异步加载，网络不可用时组件会保留文字内容。

## API 参考 {#api}

<!-- slex:spec-api:start component="icon" sourceHash="cf2e09a0" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `icon` | string | 否 | 否 |  | 通过全局图标管理器解析的图标名称。 |
| `iconOnly` | boolean | 否 | 否 |  | 在支持的场景只渲染图标，同时保留无障碍标签。 |
| `items[].icon` | string | 否 | 否 |  | Accordion 项触发器图标。 |
| `options[].icon` | string | 否 | 否 |  | Select 或 radio 选项图标。 |
| `columns[].icon` | string | 否 | 否 |  | 表格列头图标。 |
| `tabs[].icon` | string | 否 | 否 |  | Tab 触发器图标。 |
| `tabs[].iconOnly` | boolean | 否 | 否 |  | Tab 触发器纯图标模式。 |
<!-- slex:spec-api:end -->
