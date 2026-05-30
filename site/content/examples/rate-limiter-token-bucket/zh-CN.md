---
title: 令牌桶限流模拟
category: 软件工程
status: published
order: 26
summary: 输入填充速率和桶容量，模拟突发流量下的请求通过率和丢弃率。
tags: rate-limiter, token-bucket, traffic-shaping, api
components: card, input, slider, formula, stat, progress, callout, badge, grid, column
difficulty: 进阶
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 令牌桶限流模拟

令牌桶既能平滑控制长期速率，又能容忍短期突发——网关限流、API 配额、消息发送速率控制都在用。

## 核心公式

$$\text{Tokens}_{t} = \min(\text{Capacity}, \text{Tokens}_{t-1} + \text{Rate} \times \Delta t)$$

稳态通过率 = $\min(\text{Rate}, \text{RequestRate})$

```slex
{
  slex: "0.1",
  namespace: "example_rate_limiter_token_bucket",
  g: {
    fillRate: 100, bucketCapacity: 200, burstSize: 500, burstDuration: 3,
    totalRequests: function () { return this.burstDuration * this.burstSize; },
    totalTokens: function () { return this.bucketCapacity + this.fillRate * this.burstDuration; },
    approved: function () { return Math.min(this.totalRequests(), this.totalTokens()); },
    rejected: function () { return Math.max(0, this.totalRequests() - this.totalTokens()); },
    passRate: function () { return this.totalRequests() > 0 ? (this.approved() / this.totalRequests() * 100).toFixed(1) : 100; },
    bucketUsage: function () { return Math.min(100, (this.totalTokens() / this.totalRequests() * 100)); },
    status: function () { return this.rejected() > 0 ? "存在丢弃" : "全部通过"; }
  },
  layout: {
    "card:limiter": {
      title: "令牌桶限流",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:rateField": { "input:fillRate": { label: "填充速率", "$value": "g.fillRate", type: "number", unit: "tokens/s", onchange: "g.fillRate = Number($event || 0)" }, "slider:fillRate": { label: "填充速率", "$value": "g.fillRate", min: 10, max: 1000, step: 10, unit: "t/s", onchange: "g.fillRate = Number($event)" } },
        "column:capField": { "input:bucketCapacity": { label: "桶容量", "$value": "g.bucketCapacity", type: "number", unit: "tokens", onchange: "g.bucketCapacity = Number($event || 0)" }, "slider:bucketCapacity": { label: "桶容量", "$value": "g.bucketCapacity", min: 50, max: 5000, step: 50, unit: "tokens", onchange: "g.bucketCapacity = Number($event)" } },
        "column:burstField": { "input:burstSize": { label: "突发速率", "$value": "g.burstSize", type: "number", unit: "req/s", onchange: "g.burstSize = Number($event || 0)" }, "slider:burstSize": { label: "突发速率", "$value": "g.burstSize", min: 50, max: 2000, step: 50, unit: "req/s", onchange: "g.burstSize = Number($event)" } },
        "column:durationField": { "input:burstDuration": { label: "突发持续时间", "$value": "g.burstDuration", type: "number", unit: "s", onchange: "g.burstDuration = Number($event || 0)" }, "slider:burstDuration": { label: "持续时间", "$value": "g.burstDuration", min: 1, max: 10, step: 0.5, unit: "s", onchange: "g.burstDuration = Number($event)" } }
      },
      "formula:eq": { "$tex": "'\\\\text{Tokens}_{total} = ' + g.bucketCapacity + ' + ' + g.fillRate + ' \\\\times ' + g.burstDuration + ' = ' + g.totalTokens() + '\\\\text{ tokens}'" },
      "grid:results": {
        columns: 1, mdColumns: 4,
        "stat:totalRequests": { label: "总请求", "$value": "g.totalRequests().toLocaleString()", unit: "次" },
        "stat:approved": { label: "通过", "$value": "g.approved().toLocaleString()", unit: "次" },
        "stat:rejected": { label: "丢弃", "$value": "g.rejected().toLocaleString()", unit: "次" },
        "stat:passRate": { label: "通过率", "$value": "g.passRate()", unit: "%" }
      },
      "progress:usage": { label: "桶利用率", "$value": "g.bucketUsage()" },
      "badge:status": { "$label": "g.status()", "$tone": "g.rejected() > 0 ? 'danger' : 'success'" },
      "callout:advice": { "$tone": "g.rejected() > 0 ? 'warning' : 'info'", "$text": "g.rejected() > 0 ? '桶容量不足以吸收突发流量！增大桶容量或提高填充速率。' : '当前参数可完全吸收突发流量。'" }
    }
  }
}
```

Fallback：100 t/s, 桶 200, 突发 500 req/s × 3s → 1500 请求, 500 tokens → 通过率 33%。

| 参数 | 作用 | 调节建议 |
|------|------|---------|
| 填充速率 | 稳态 QPS 上限 | 按 SLA 约定 |
| 桶容量 | 最大突发量 | 取 1-2 秒请求量 |

- 漏桶 vs 令牌桶：漏桶强制平滑（保护下游），令牌桶允许突发（API 网关）
- 分级限流：先全局（Redis），再本地（内存令牌桶）
- 限流返回 429 + Retry-After，让客户端主动退避
