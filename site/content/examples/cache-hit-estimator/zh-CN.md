---
title: 缓存命中率估算
category: 软件工程
status: published
order: 20
summary: 调整缓存命中率和延迟参数，精确计算平均响应时间、源站压力和延迟节省量。
tags: cache, performance, latency
components: card, input, slider, formula, stat, table, callout, grid, column
difficulty: 入门
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 缓存命中率估算

多层缓存是现代 Web 服务的第一道防线。CDN、Redis、本地内存——每一层都在用空间换时间。

## 核心公式

$$\text{AvgLatency} = \frac{H \times L_{cache} + (1-H) \times L_{origin}}{100}$$

```slex
{
  slex: "0.1",
  namespace: "example_cache_hit_estimator",
  g: {
    totalRequests: 10000, cacheHitRate: 85, cacheLatency: 5, originLatency: 200,
    avgLatency: function () { return (this.cacheHitRate * this.cacheLatency + (100 - this.cacheHitRate) * this.originLatency) / 100; },
    savedMs: function () { return this.originLatency - this.avgLatency(); },
    savedPercent: function () { return (this.savedMs() / this.originLatency * 100).toFixed(1); },
    originRequests: function () { return Math.round(this.totalRequests * (100 - this.cacheHitRate) / 100); }
  },
  layout: {
    "card:cache": {
      title: "缓存命中率估算",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:hitField": { "input:hit": { label: "缓存命中率", "$value": "g.cacheHitRate", type: "number", unit: "%", onchange: "g.cacheHitRate = Number($event || 0)" }, "slider:hit": { label: "命中率", "$value": "g.cacheHitRate", min: 0, max: 100, step: 1, unit: "%", onchange: "g.cacheHitRate = Number($event)" } },
        "column:cacheField": { "input:cacheLatency": { label: "缓存延迟", "$value": "g.cacheLatency", type: "number", unit: "ms", onchange: "g.cacheLatency = Number($event || 0)" }, "slider:cacheLatency": { label: "缓存延迟", "$value": "g.cacheLatency", min: 1, max: 500, step: 1, unit: "ms", onchange: "g.cacheLatency = Number($event)" } },
        "column:totalField": { "input:total": { label: "总请求量", "$value": "g.totalRequests", type: "number", onchange: "g.totalRequests = Number($event || 0)" }, "slider:total": { label: "总请求量", "$value": "g.totalRequests", min: 1000, max: 100000, step: 1000, onchange: "g.totalRequests = Number($event)" } },
        "column:originField": { "input:originLatency": { label: "源站延迟", "$value": "g.originLatency", type: "number", unit: "ms", onchange: "g.originLatency = Number($event || 0)" }, "slider:originLatency": { label: "源站延迟", "$value": "g.originLatency", min: 10, max: 5000, step: 10, unit: "ms", onchange: "g.originLatency = Number($event)" } }
      },
      "formula:equation": { "$tex": "'\\\\text{AvgLatency} = \\\\frac{' + g.cacheHitRate + ' \\\\times ' + g.cacheLatency + ' + ' + (100-g.cacheHitRate) + ' \\\\times ' + g.originLatency + '}{100} = ' + g.avgLatency().toFixed(1) + '\\\\text{ ms}'" },
      "grid:results": {
        columns: 1, mdColumns: 4,
        "stat:avgLatency": { label: "平均延迟", "$value": "g.avgLatency().toFixed(1)", unit: "ms" },
        "stat:saved": { label: "延迟节省", "$value": "g.savedMs().toFixed(1)", unit: "ms" },
        "stat:percent": { label: "改善幅度", "$value": "g.savedPercent()", unit: "%" },
        "stat:originReqs": { label: "打到源站", "$value": "g.originRequests().toLocaleString()", unit: "次" }
      },
      "callout:advice": { "$tone": "g.cacheHitRate > 90 ? 'success' : g.cacheHitRate > 70 ? 'info' : 'warning'", "$text": "g.cacheHitRate > 90 ? '高命中率，缓存效果显著。' : g.cacheHitRate > 70 ? '中等命中率，仍有优化空间。' : '低命中率，缓存收益有限。'" }
    }
  }
}
```

Fallback：85% 命中率，缓存 5ms，源站 200ms → 平均延迟约 34ms，节省 83%。

| 缓存层级 | 典型延迟 | 典型命中率 | 说明 |
|---------|---------|-----------|------|
| CDN 边缘 | 1–5 ms | 90–99% | 静态资源 |
| Redis | 0.5–3 ms | 80–95% | 热点数据 |
| 本地内存 | < 0.01 ms | 60–80% | 进程内，容量小 |

- 命中率从 80% 提到 95%，源站流量减少 75%
- 缓存的收益曲线是凹的——最后 5% 的提升成本很高
