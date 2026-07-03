---
title: 设计哲学
category: Guides
status: ready
order: 30
summary: "动态 Markdown、组件和 Agent 友好 UI 输出的设计原则。"
includeTitleInToc: true
slexkitRenderMode: component
---

# SlexKit 设计哲学

**文档即工具，工具即文档。**

静态文档可以嵌入可交互组件，agent 输出也可以携带结构化 UI。

```slex
{
  namespace: "design_philosophy",
  layout: {
    "diagram:philosophy": {},
    "grid:philosophy": {
      columns: 1,
      lgColumns: 3,
      "card:task": {
        tone: "primary",
        "heading:title": { level: 4, title: "任务优先" },
        "text:bodyA": { text: "从用户需要完成的任务出发。" },
        "text:bodyB": { text: "每一步设计都服务于核心任务。" }
      },
      "card:intuitive": {
        tone: "info",
        "heading:title": { level: 4, title: "直觉交互" },
        "text:bodyA": { text: "文档自带示例，操作后立即呈现结果。" },
        "text:bodyB": { text: "按域分块，数据穿越式绑定。" }
      },
      "card:breath": {
        tone: "success",
        "heading:title": { level: 4, title: "视觉呼吸" },
        "text:bodyA": { text: "留白、间距创造视觉节奏。" },
        "text:bodyB": { text: "字体、颜色构建清晰层次。" }
      }
    }
  }
}
```

## 颜色语义

颜色只表达角色，不表达个人偏好。

```slex
{
  namespace: "design_color",
  layout: {
    "grid:colors": {
      columns: 1,
      mdColumns: 2,
      lgColumns: 3,
      "card:primary": {
        tone: "primary",
        "swatch:primary": { tone: "primary" },
        "heading:title": { level: 4, title: "主要" },
        "text:body": { text: "主操作、当前选中、高优先级强调。不要当普通装饰色。" }
      },
      "card:info": {
        tone: "info",
        "swatch:info": { tone: "info" },
        "heading:title": { level: 4, title: "信息" },
        "text:body": { text: "提示、引导、说明性状态。不要替代 Primary。" }
      },
      "card:success": {
        tone: "success",
        "swatch:success": { tone: "success" },
        "heading:title": { level: 4, title: "成功" },
        "text:body": { text: "完成、通过、可继续。只在结果明确后使用。" }
      },
      "card:warning": {
        tone: "warning",
        "swatch:warning": { tone: "warning" },
        "heading:title": { level: 4, title: "警告" },
        "text:body": { text: "风险、阈值、需复核但未失败。不要用来提亮页面。" }
      },
      "card:destructive": {
        tone: "destructive",
        "swatch:destructive": { tone: "destructive" },
        "heading:title": { level: 4, title: "危险" },
        "text:body": { text: "错误、删除、不可逆操作。必须伴随后果说明。" }
      },
      "card:neutral": {
        tone: "neutral",
        "swatch:neutral": { tone: "neutral" },
        "heading:title": { level: 4, title: "中性" },
        "text:body": { text: "背景、分隔、辅助信息和默认容器。负责结构，不负责强调。" }
      }
    }
  }
}
```

## 小卡片排列

小卡片用于比较和判断。指标总览这类同类项直接并排；系统负责等宽、间距和换行；有归属才包卡，有顺序才竖排。

```slex
{
  namespace: "design_arrangement",
  layout: {
    "column:arrange": {
      "row:metrics": {
        "stat:requests": {
          label: "请求",
          value: "1.2k",
          unit: "/min",
          tone: "info"
        },
        "stat:success": {
          label: "通过",
          value: "98.4",
          unit: "%",
          tone: "success"
        },
        "stat:latency": {
          label: "延迟",
          value: "42",
          unit: "ms"
        },
        "stat:errors": {
          label: "错误",
          value: "3",
          unit: "次",
          tone: "warning"
        },
        "stat:queued": {
          label: "排队",
          value: "8"
        }
      },
      "grid:examples": {
        columns: 1,
        mdColumns: 2,
        "card:summary": {
          title: "同一对象",
          "row:service": {
            "stat:idle": {
              label: "待处理",
              value: "12"
            },
            "stat:active": {
              label: "运行中",
              value: "5",
              tone: "info"
            },
            "stat:done": {
              label: "已完成",
              value: "47",
              tone: "success"
            },
            "stat:failed": {
              label: "失败",
              value: "2",
              tone: "danger"
            }
          }
        },
        "card:flow": {
          title: "有顺序",
          "column:steps": {
            "stat:input": {
              label: "输入",
              value: "1"
            },
            "stat:compute": {
              label: "计算",
              value: "2",
              tone: "info"
            },
            "stat:output": {
              label: "输出",
              value: "3",
              tone: "success"
            }
          }
        }
      }
    }
  }
}
```

## 字体与图标

SlexKit 的字体设计追求冷静、清楚、工程感；图标风格轻量、圆润、克制，作为界面的标点符号而非装饰插画。

```slex
{
  namespace: "design_type_icon",
  layout: {
    "grid:type": {
      columns: 1,
      lgColumns: 2,
      "card:type": {
        "heading:title": { level: 4, title: "字体语气", meta: "GEIST / NOTO SANS SC" },
        "diagram:font": { kind: "font-sample" },
        "text:body": { text: "英文优先 Geist，中文接 Noto Sans SC。字形保持开阔、干净，服务阅读而不是制造声量。" }
      },
      "card:icon": {
        "heading:title": { level: 4, title: "图标语气", meta: "PHOSPHOR ICONS" },
        "row:icons": {
          "button:sparkle": { icon: "sparkle", iconOnly: true, label: "辅助" },
          "button:book": { icon: "book-open-text", iconOnly: true, label: "手册" },
          "button:terminal": { icon: "terminal-window", iconOnly: true, label: "终端" },
          "button:cursor": { icon: "cursor-click", iconOnly: true, label: "点击" },
          "button:nut": { icon: "nut", iconOnly: true, label: "螺母" },
          "button:gear": { icon: "gear-six", iconOnly: true, label: "设置" }
        },
        "text:body": { text: "Phosphor 的气质来自几何轮廓、圆角转折和均匀笔画。选择图标时先看这组语气是否一致，再看语义是否准确。" }
      }
    }
  }
}
```

## Markdown 写法

设计规范和组件页采用 Markdown 承载正文，`slex` 代码块承载可运行示例，实现文档即工具、工具即文档的编写方式。

```slex
{
  namespace: "design_markdown",
  layout: {
    "grid:doc": {
      columns: 1,
      lgColumns: 3,
      "card:write": {
        "diagram:markdown": {},
        "heading:title": { level: 4, title: "正文用 Markdown" },
        "text:body": { text: "说明场景、限制和判断规则，不把说明写进 UI 组件里。" }
      },
      "card:run": {
        "diagram:fence": {},
        "heading:title": { level: 4, title: "示例用 slex" },
        "text:body": { text: "每个关键示例都能直接渲染和预览，而不是截图。" }
      },
      "card:compare": {
        "diagram:cards": {},
        "heading:title": { level: 4, title: "规则用小卡片" },
        "text:body": { text: "把可比较的原则放进卡片，让读者扫一眼就能判断。" }
      }
    }
  }
}
```

## 产品形态

SlexKit 用于 Markdown 中的交互片段，而非完整应用。典型场景包括：

- 解释结果的卡片
- 一组指标总览
- 表单式控制区
- 状态或确认块

框架专注于文档内嵌交互，不涉及路由、全局应用状态、SSR、数据获取框架或通用 UI 标准化。

```slex
{
  namespace: "design_shape",
  layout: {
    "card:status": {
      title: "构建摘要",
      tone: "info",
      "row:metrics": {
        "stat:passed": { label: "通过", value: 28, tone: "success" },
        "stat:failed": { label: "失败", value: 1, tone: "danger" },
        "stat:queued": { label: "排队", value: 3, tone: "muted" }
      },
      "text:note": {
        text: "界面只聚焦一个文档或消息任务。"
      }
    }
  }
}
```

## Tone 规则

组件支持语义化 tone 值，用于表达状态角色。

```slex
{
  namespace: "design_tones",
  layout: {
    "grid:tones": {
      columns: 1,
      mdColumns: 2,
      lgColumns: 3,
      "card:info": {
        tone: "info",
        "badge:tone": { label: "信息", tone: "info" },
        "text:body": { text: "中性引导、当前过程或信息状态。" }
      },
      "card:success": {
        tone: "success",
        "badge:tone": { label: "成功", tone: "success" },
        "text:body": { text: "已完成、已接受或可继续状态。" }
      },
      "card:warning": {
        tone: "warning",
        "badge:tone": { label: "警告", tone: "warning" },
        "text:body": { text: "风险、阈值或需要复核的状态。" }
      },
      "card:danger": {
        tone: "danger",
        "badge:tone": { label: "危险", tone: "danger" },
        "text:body": { text: "错误、破坏性操作或阻塞状态。" }
      },
      "card:muted": {
        tone: "muted",
        "badge:tone": { label: "弱化", tone: "muted" },
        "text:body": { text: "次要或背景信息。" }
      }
    }
  }
}
```

## 展示 UI 与 ToolHost

展示型 UI 用于信息呈现和局部交互。当宿主需要从用户处获取结构化结果时，使用 ToolHost 模式。

```slex
{
  namespace: "design_boundary",
  layout: {
    "grid:boundary": {
      columns: 1,
      mdColumns: 2,
      "card:display": {
        tone: "muted",
        title: "展示 UI",
        "text:body": { text: "用 slex fence 渲染状态、指标、预览和局部控件。" },
        "badge:kind": { label: "不返回宿主结果", tone: "muted" }
      },
      "card:toolhost": {
        tone: "info",
        title: "ToolHost",
        "text:body": { text: "需要把确认或表单数据返回宿主时，使用工具模板。" },
        "badge:kind": { label: "返回 ToolResult", tone: "info" }
      }
    }
  }
}
```
