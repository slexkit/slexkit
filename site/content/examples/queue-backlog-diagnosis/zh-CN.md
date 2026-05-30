---
title: 队列积压诊断
category: 软件工程
status: published
order: 23
summary: 分析消息队列积压场景，通过调节生产速度和消费能力，判断积压能否自然清空及预计耗时。
tags: queue, workers, diagnosis, message-broker
components: card, input, slider, formula, stat, callout, badge, grid, column
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 队列积压诊断

消息队列突然堆积几千条——是生产流量飙升，还是消费者跟不上？两种原因的应对策略完全不同。

## 核心公式

$$\text{Capacity} = \text{Workers} \times \text{Throughput}$$

当 $\text{Capacity} > \text{Producers}$ 时清空时间 = $\text{Backlog} / (\text{Capacity} - \text{Producers})$

```slex
{
  slex: "0.1",
  namespace: "example_queue_backlog_diagnosis",
  g: {
    backlog: 4800, producers: 120, workers: 12, throughput: 55,
    capacity: function () { return this.workers * this.throughput; },
    netDrain: function () { return this.capacity() - this.producers; },
    drainMinutes: function () { return this.netDrain() > 0 ? this.backlog / this.netDrain() : Infinity; },
    drainHours: function () { return this.drainMinutes() / 60; },
    canDrain: function () { return this.netDrain() > 0; },
    strategy: function () { return this.canDrain() ? "扩容有效" : "需要限流"; }
  },
  layout: {
    "card:queue": {
      title: "队列积压诊断",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:backlogField": { "input:backlog": { label: "当前积压", "$value": "g.backlog", type: "number", unit: "条", onchange: "g.backlog = Number($event || 0)" }, "slider:backlog": { label: "积压", "$value": "g.backlog", min: 0, max: 20000, step: 100, onchange: "g.backlog = Number($event)" } },
        "column:workersField": { "input:workers": { label: "Worker 数量", "$value": "g.workers", type: "number", unit: "个", onchange: "g.workers = Number($event || 0)" }, "slider:workers": { label: "Workers", "$value": "g.workers", min: 1, max: 100, step: 1, onchange: "g.workers = Number($event)" } },
        "column:tpField": { "input:throughput": { label: "单 Worker 吞吐", "$value": "g.throughput", type: "number", unit: "条/分", onchange: "g.throughput = Number($event || 0)" }, "slider:throughput": { label: "吞吐", "$value": "g.throughput", min: 5, max: 500, step: 5, unit: "条/分", onchange: "g.throughput = Number($event)" } },
        "column:prodField": { "input:producers": { label: "生产速度", "$value": "g.producers", type: "number", unit: "条/分", onchange: "g.producers = Number($event || 0)" }, "slider:producers": { label: "生产速度", "$value": "g.producers", min: 5, max: 500, step: 5, unit: "条/分", onchange: "g.producers = Number($event)" } }
      },
      "formula:eq": { "$tex": "'\\\\text{Capacity} = ' + g.workers + ' \\\\times ' + g.throughput + ' = ' + g.capacity() + '\\\\text{ 条/分}'" },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:capacity": { label: "消费能力", "$value": "g.capacity()", unit: "条/分" },
        "stat:netDrain": { label: "净消化", "$value": "g.netDrain()", unit: "条/分" },
        "stat:drain": { label: "预计清空", "$value": "Number.isFinite(g.drainMinutes()) ? (g.drainHours() >= 1 ? g.drainHours().toFixed(1) + '小时' : g.drainMinutes().toFixed(0) + '分钟') : '∞'" }
      },
      "badge:strategy": { "$label": "g.strategy()", "$tone": "g.canDrain() ? 'success' : 'danger'" },
      "callout:advice": { "$tone": "g.canDrain() ? 'info' : 'danger'", "$text": "g.canDrain() ? '消费能力 > 生产速度，积压预计在 ' + (g.drainHours() >= 1 ? g.drainHours().toFixed(1) + '小时' : g.drainMinutes().toFixed(0) + '分钟') + ' 后清空。' : '消费能力不足，立即采取措施：① 增加 worker；② 上游限流；③ 死信队列兜底。'" }
    }
  }
}
```

Fallback：12 worker × 55 条/分 = 660 条/分，净消化 540 条/分，约 9 分钟清空。

- 告警阈值：生产速度达到消费能力 80% 时就应该告警
- 消息 TTL：清空时间 > TTL 则消息过期
- 死信队列：消费多次失败的消息进入死信队列单独分析
