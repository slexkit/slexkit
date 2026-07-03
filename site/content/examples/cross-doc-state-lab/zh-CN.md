---
title: "跨文档状态实验室"
category: "平台能力"
status: published
order: 15
summary: "多块 `slex` 代码使用同一个 namespace，共享同一份响应式 `g` 状态。"
tags: cross-document, state-sharing, namespace, multi-fence
components: section, card, slider, input, select, stat, badge, callout, grid, column, tabs
difficulty: 入门
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 跨文档状态实验室

同一篇 Markdown 中的多个 `slex` 代码块可以通过相同 `namespace` 共享 `g` 状态。

下面是三个独立的 ` ```slex ` fence——一个控制面板和两个观察面板。试试修改控制面板的值，看下方两个面板实时响应。

## 主控面板

```slex
{
  slex: "0.1",
  namespace: "example_cross_doc_lab",
  g: {
    color: "blue", size: 16, theme: "light",
    style: function () {
      return 'color: ' + this.color + '; font-size: ' + this.size + 'px;';
    }
  },
  layout: {
    "section:control": {
      eyebrow: "平台能力",
      title: "跨文档状态实验室 · 主控面板",
      subtitle: "修改以下任何参数——下方两个独立 fence 块的卡片会同步更新。",
      "grid:controls": {
        columns: 1, mdColumns: 3,
        "select:color": {
          label: "文字颜色",
          "$value": "g.color",
          options: [
            { label: "蓝色", value: "blue" },
            { label: "绿色", value: "green" },
            { label: "橙色", value: "orange" },
            { label: "紫色", value: "purple" }
          ],
          onchange: "g.color = String($event)"
        },
        "slider:size": { label: "字体大小", "$value": "g.size", min: 8, max: 48, step: 2, unit: "px", onchange: "g.size = Number($event)" },
        "select:theme": {
          label: "卡片主题",
          "$value": "g.theme",
          options: [
            { label: "明亮", value: "light" },
            { label: "暗色", value: "dark" },
            { label: "信息", value: "info" }
          ],
          onchange: "g.theme = String($event)"
        }
      },
      "badge:note": { "$label": "'样式 ' + g.color + ' ' + g.size + 'px'", tone: "info" }
    }
  }
}
```

## 观察面板 A（同一 namespace，不同 fence 块）

```slex
{
  slex: "0.1",
  namespace: "example_cross_doc_lab",
  layout: {
    "card:a": {
      title: "观察面板 A — 纯文本样式",
      "column:stylePreview": {
        "text:styleMeta": { "$text": "'字体大小：' + g.size + 'px'" },
        "text:styledValue": { "$text": "g.color", "$color": "g.color", "$size": "g.size" }
      },
      "callout:preview": {
        "$tone": "g.theme === 'dark' ? 'danger' : g.theme === 'info' ? 'info' : 'success'",
        "$text": "g.theme === 'dark' ? '暗色模式：适合夜间阅读的配色方案。' : g.theme === 'info' ? '信息模式：用于强调技术细节。' : '明亮模式：默认的文档阅读配色。'"
      }
    }
  }
}
```

## 观察面板 B

```slex
{
  slex: "0.1",
  namespace: "example_cross_doc_lab",
  layout: {
    "card:b": {
      title: "观察面板 B — 参数详情",
      "grid:params": {
        columns: 1, mdColumns: 3,
        "stat:col": { label: "颜色", "$value": "g.color" },
        "stat:sz": { label: "字号", "$value": "g.size", unit: "px" },
        "stat:th": { label: "主题", "$value": "g.theme" }
      },
      "badge:sync": { "$label": "'已同步 ' + g.color", "$tone": "g.color === 'blue' ? 'info' : g.color === 'green' ? 'success' : g.color === 'orange' ? 'warning' : 'info'" }
    }
  }
}
```

**三个 fence 块**，同一个 `namespace: "example_cross_doc_lab"`，所有组件共享 `g` 对象。主控面板中的颜色和大小变化会同步到两个观察面板。

---

### 这意味着什么？

在一篇长篇 Markdown 文档中：

```
[控制面板 — 选择行业/指标/时间范围]
... 30 段 Markdown 叙事 ...
[图表 A — 自动反映控制面板的选项]
... 更多分析文字 ...
[图表 B — 同一份状态的不同可视化]
```

每个 ` ```slex ` 块可以独立渲染；namespace 相同时，它们共享状态。常见用法包括：

- **技术白皮书**：顶部选参数，中间分析，底部结论，全程联动
- **项目协作文档**：状态跟踪表格在顶部，各团队任务卡片散布在正文中
- **AI 输出增强**：模型生成的多个可视化节点共享同一份推理结果

这些场景都依赖同一个机制：多块 fence 共享同一份状态，而不是把每块 UI 当成完全独立的组件。
