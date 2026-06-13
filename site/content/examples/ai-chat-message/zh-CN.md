---
title: "AI 聊天消息中的交互片段"
category: "聊天消息场景"
status: published
order: 6
summary: "展示 AI 聊天输出中嵌入 slex fence 的完整形态，包括 Markdown 叙事 + 交互组件 + fallback 文本。"
tags: ai, chat, message, interactive
components: card, slider, stat, callout, badge, section, grid
difficulty: 入门
runtime: trusted
featured: true
slexkitRenderMode: component
---

# AI 聊天消息中的交互片段

这是 SlexKit 的首要场景：**在 AI 聊天输出中嵌入交互式组件**。

下面是一个模拟的 AI 回复，包含：
1. **Markdown 叙事** - AI 的分析文字
2. **slex fence** - 交互式数据面板
3. **fallback 文本** - 不支持 SlexKit 时的降级显示

---

## AI 分析结果

根据你的数据，我发现了以下趋势：

```slex
{
  slex: "0.1",
  namespace: "ai_chat_message",
  g: { metric: "revenue", period: "monthly", value: 125000 },
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

**关键点：**
- AI 生成的分析文字（Markdown）
- 嵌入的交互式数据面板（slex fence）
- 用户可调整参数重新计算
- 不支持 SlexKit 时显示 fallback 文本

这就是 SlexKit 的核心价值：**让 AI 的输出变得可交互**。

---

### Fallback 文本

如果不支持 SlexKit，上面的代码块会显示为普通代码块，用户可以看到原始的 DSL 定义。这就是"Markdown 原生"的意义——降级优雅，不影响阅读。
