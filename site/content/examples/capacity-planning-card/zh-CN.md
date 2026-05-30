---
title: 容量规划卡
category: 软件工程
status: published
order: 24
summary: 输入用户量、峰值倍数和目标 RPS，估算系统容量的安全余量和是否需要扩容。
tags: capacity, planning, scaling, rps
components: card, input, slider, formula, stat, callout, badge, grid, column
difficulty: 入门
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 容量规划卡

系统能扛多少流量，不是上线后才知道的。容量规划 = 把日常 RPS、峰值倍数和目标吞吐量放在一起比。

## 核心公式

$$\text{PeakRPS} = \frac{\text{Users} \times \text{ReqPerUser}}{86400} \times \text{PeakMultiplier}$$

$$\text{Headroom} = \frac{\text{TargetRPS} - \text{PeakRPS}}{\text{TargetRPS}} \times 100\%$$

```slex
{
  slex: "0.1",
  namespace: "example_capacity_planning_card",
  g: {
    currentUsers: 5000, peakMultiplier: 3, requestPerUser: 10, targetRps: 500,
    normalRps: function () { return Math.round(this.currentUsers * this.requestPerUser / 86400 * 100) / 100; },
    peakRps: function () { return Math.round(this.normalRps() * this.peakMultiplier * 100) / 100; },
    headroom: function () { return this.targetRps > 0 ? ((this.targetRps - this.peakRps()) / this.targetRps * 100).toFixed(1) : 0; },
    canHandle: function () { return Number(this.headroom()) > 0; },
    tone: function () { var h = Number(this.headroom()); return h > 30 ? "success" : h > 0 ? "warning" : "danger"; }
  },
  layout: {
    "card:capacity": {
      title: "容量规划",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:usersField": { "input:users": { label: "日活用户", "$value": "g.currentUsers", type: "number", unit: "人", onchange: "g.currentUsers = Number($event || 0)" }, "slider:users": { label: "日活", "$value": "g.currentUsers", min: 100, max: 100000, step: 100, unit: "人", onchange: "g.currentUsers = Number($event)" } },
        "column:multField": { "input:multiplier": { label: "峰值倍数", "$value": "g.peakMultiplier", type: "number", unit: "x", onchange: "g.peakMultiplier = Number($event || 0)" }, "slider:multiplier": { label: "峰值倍数", "$value": "g.peakMultiplier", min: 1, max: 10, step: 0.5, unit: "x", onchange: "g.peakMultiplier = Number($event)" } },
        "column:reqField": { "input:reqPerUser": { label: "人均请求", "$value": "g.requestPerUser", type: "number", unit: "次/天", onchange: "g.requestPerUser = Number($event || 0)" }, "slider:reqPerUser": { label: "人均请求", "$value": "g.requestPerUser", min: 1, max: 200, step: 1, unit: "次/天", onchange: "g.requestPerUser = Number($event)" } },
        "column:targetField": { "input:targetRps": { label: "目标 RPS", "$value": "g.targetRps", type: "number", unit: "req/s", onchange: "g.targetRps = Number($event || 0)" }, "slider:targetRps": { label: "目标 RPS", "$value": "g.targetRps", min: 100, max: 50000, step: 100, unit: "req/s", onchange: "g.targetRps = Number($event)" } }
      },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:peakRps": { label: "峰值 RPS", "$value": "g.peakRps().toFixed(2)", unit: "req/s" },
        "stat:headroom": { label: "容量余量", "$value": "g.headroom()", unit: "%" },
        "badge:status": { "$label": "g.canHandle() ? '容量充足' : '需要扩容'", "$tone": "g.tone()" }
      },
      "callout:advice": { "$tone": "g.tone()", "$text": "Number(g.headroom()) > 30 ? '容量充裕（>30%），可支撑突发增长。' : Number(g.headroom()) > 0 ? '容量偏紧，建议预留扩容方案。' : '容量不足！需要扩容、优化延迟或引入限流。'" }
    }
  }
}
```

Fallback：5000 用户 × 10/天 × 3x 峰值 → ~1.74 RPS，目标 500 → 余量充足。

- 电商大促峰值倍数 5-10x，内部管理后台 1-2x
- RPS 不是全部：同样 RPS，延迟决定并发数（$C = RPS \times Latency$）
- 数据库也是瓶颈：扩容 RPS 时连接池和缓存也需一并评估
