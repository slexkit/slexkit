---
title: "ToolHost 选择模板"
category: "AI 代理场景"
status: published
order: 16
summary: "使用 choose-options 模板构建多选项选择界面"
tags: toolhost, choose, options, ai, agent
components: toolhost, card, callout, badge, section, grid
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# ToolHost 选择模板

AI 需要用户做出选择时（如选择数据库、部署环境、模板），ToolHost 的 choose-options 模板提供了标准化的选择界面。每个选项以卡片形式展示，选中后有明确的状态反馈。

---

## 选项选择

```slex
{
  slex: "0.1",
  namespace: "toolhost_choose",
  g: {
    question: "请选择部署环境",
    options: [
      { id: "dev", label: "开发环境", description: "用于开发和测试" },
      { id: "staging", label: "预发布环境", description: "用于上线前验证" },
      { id: "prod", label: "生产环境", description: "正式上线环境" }
    ],
    selected: null,
    select: function (id) {
      this.selected = id;
    }
  },
  layout: {
    "section:choose": {
      eyebrow: "ToolHost · 选择模板",
      title: "选项选择",
      subtitle: "AI 提供多个选项，用户选择一个。",
      "callout:question": {
        tone: "info",
        "$text": "g.question"
      },
      "grid:options": {
        columns: 1, mdColumns: 3,
        "card:dev": {
          title: "开发环境",
          "callout:desc": {
            tone: "info",
            text: "用于开发和测试"
          },
          "button:select": {
            label: "选择",
            onclick: "g.select('dev')",
            "$disabled": "g.selected === 'dev'"
          }
        },
        "card:staging": {
          title: "预发布环境",
          "callout:desc": {
            tone: "warning",
            text: "用于上线前验证"
          },
          "button:select": {
            label: "选择",
            onclick: "g.select('staging')",
            "$disabled": "g.selected === 'staging'"
          }
        },
        "card:prod": {
          title: "生产环境",
          "callout:desc": {
            tone: "danger",
            text: "正式上线环境"
          },
          "button:select": {
            label: "选择",
            onclick: "g.select('prod')",
            "$disabled": "g.selected === 'prod'"
          }
        }
      },
      "callout:result": {
        "$tone": "g.selected ? 'success' : 'info'",
        "$text": "g.selected ? '已选择: ' + (g.selected === 'dev' ? '开发环境' : g.selected === 'staging' ? '预发布环境' : '生产环境') : '请选择一个选项'"
      }
    }
  }
}
```

选中某个选项后，对应的按钮变为禁用，底部显示选择结果。

---

### Fallback

不支持 SlexKit 的环境会显示原始 DSL 代码块。
