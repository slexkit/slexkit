---
title: "AI 聊天消息中的交互片段"
category: "聊天消息场景"
status: published
order: 6
summary: "在AI聊天消息中嵌入交互式数据面板"
tags: ai, chat, message, interactive
components: section, grid, select, slider, stat, callout
difficulty: 入门
runtime: trusted
featured: true
slexkitRenderMode: component
---

# AI 聊天消息中的交互片段

AI 聊天回复通常只有纯文本。如果回复中能嵌入可交互的数据面板，用户就可以直接调整参数、查看不同维度的结果，而不需要切换到其他工具。

下面的示例模拟了一条 AI 回复，包含 Markdown 叙事文本和一个嵌入的 slex fence 交互面板。

---

## AI 分析结果

根据你的数据，我发现了以下趋势：

```slex
{
  slex: "0.1",
  namespace: "ai_chat_message",
  g: { metric: "revenue", period: 1, value: 125000 },
  layout: {
    "section:analysis": {
      eyebrow: "AI 数据分析",
      title: "关键指标监控",
      subtitle: "拖动滑块调整时间范围，查看不同维度的数据。",
      "grid:controls": {
        columns: 1, mdColumns: 2,
        "select:metric": {
          label: "指标维度",
          "$value": "g.metric",
          options: [
            { label: "收入", value: "revenue" },
            { label: "用户数", value: "users" },
            { label: "转化率", value: "conversion" }
          ],
          onchange: "g.metric = String($event)"
        },
        "slider:period": {
          label: "时间范围",
          "$value": "g.period",
          min: 1,
          max: 12,
          step: 1,
          unit: "月",
          onchange: "g.period = Number($event)"
        }
      },
      "stat:value": {
        "$label": "g.metric === 'revenue' ? '总收入' : g.metric === 'users' ? '活跃用户' : '转化率'",
        "$value": "g.metric === 'revenue' ? '¥' + (g.value * g.period).toLocaleString() : g.metric === 'users' ? (g.value * g.period * 0.8).toLocaleString() : (g.value / 1000 * g.period).toFixed(1) + '%'"
      },
      "callout:insight": {
        tone: "info",
        "$text": "g.metric === 'revenue' ? '收入趋势稳定增长，建议继续优化转化漏斗。' : g.metric === 'users' ? '用户增长符合预期，可考虑扩大推广渠道。' : '转化率有提升空间，建议优化用户引导流程。'"
      }
    }
  }
}
```

面板中的指标维度和时间范围都可以交互调整，stat 和 callout 会根据用户的选择实时更新。

---

### Fallback

不支持 SlexKit 的环境会显示原始 DSL 代码块。
