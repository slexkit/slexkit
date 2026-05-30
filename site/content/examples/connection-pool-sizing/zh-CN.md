---
title: 数据库连接池估算
category: 软件工程
status: published
order: 25
summary: 输入 QPS、平均查询时间和 CPU 核数，计算推荐连接池大小和最大并发数。
tags: database, connection-pool, performance
components: card, input, slider, formula, stat, table, callout, badge, grid, column
difficulty: 进阶
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 数据库连接池估算

池太小 → 请求排队超时；池太大 → 连接数爆炸。合适的池大小能发挥数据库最大吞吐。

## 核心公式

排队论：$N_{pool} = \frac{\text{QPS} \times T_{avg}}{1 - \rho}$

经验公式（HikariCP 推荐）：$N_{pool} = \text{CPU Cores} \times 2 + \text{Spindles}$

```slex
{
  slex: "0.1",
  namespace: "example_connection_pool_sizing",
  g: {
    qps: 500, queryTimeMs: 8, targetUtil: 0.7, cpuCores: 8, diskCount: 2,
    queryTimeSec: function () { return this.queryTimeMs / 1000; },
    poolByQueue: function () { return Math.ceil(this.qps * this.queryTimeSec() / (1 - this.targetUtil)); },
    poolByCpu: function () { return this.cpuCores * 2 + this.diskCount; },
    maxConnections: function () { return Math.min(this.poolByQueue(), this.poolByCpu()); },
    isSafe: function () { return this.poolByQueue() <= this.poolByCpu() + 10; }
  },
  layout: {
    "card:pool": {
      title: "连接池估算",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:qpsField": { "input:qps": { label: "目标 QPS", "$value": "g.qps", type: "number", unit: "queries/s", onchange: "g.qps = Number($event || 0)" }, "slider:qps": { label: "QPS", "$value": "g.qps", min: 10, max: 10000, step: 10, unit: "q/s", onchange: "g.qps = Number($event)" } },
        "column:timeField": { "input:queryTimeMs": { label: "平均查询时间", "$value": "g.queryTimeMs", type: "number", unit: "ms", onchange: "g.queryTimeMs = Number($event || 0)" }, "slider:queryTimeMs": { label: "查询时间", "$value": "g.queryTimeMs", min: 1, max: 500, step: 1, unit: "ms", onchange: "g.queryTimeMs = Number($event)" } },
        "column:cpuField": { "input:cpuCores": { label: "数据库 CPU 核数", "$value": "g.cpuCores", type: "number", unit: "核", onchange: "g.cpuCores = Number($event || 0)" }, "slider:targetUtil": { label: "目标利用率", "$value": "g.targetUtil", min: 0.3, max: 0.95, step: 0.05, onchange: "g.targetUtil = Number($event)" } },
        "column:diskField": { "input:diskCount": { label: "SSD 数量", "$value": "g.diskCount", type: "number", unit: "个", onchange: "g.diskCount = Number($event || 0)" } }
      },
      "formula:queue": { "$tex": "'N_{queue} = \\\\frac{' + g.qps + ' \\\\times ' + g.queryTimeSec().toFixed(3) + '}{1 - ' + g.targetUtil + '} = ' + g.poolByQueue() + '\\\\text{ 连接}'" },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:poolByQueue": { label: "排队论估算", "$value": "g.poolByQueue()", unit: "个连接" },
        "stat:poolByCpu": { label: "经验公式上限", "$value": "g.poolByCpu()", unit: "个连接" },
        "stat:maxConnections": { label: "推荐最大连接数", "$value": "g.maxConnections()" }
      },
      "badge:status": { "$label": "g.isSafe() ? '配置安全' : '池过大风险'", "$tone": "g.isSafe() ? 'success' : 'warning'" },
      "callout:advice": { "$tone": "g.isSafe() ? 'info' : 'warning'", "$text": "g.isSafe() ? '连接池大小在安全范围内。' : '排队论估算超过经验上限！建议优化慢查询或引入缓存降低 QPS。'" }
    }
  }
}
```

Fallback：500 QPS × 8ms / (1-0.7) = 14 个连接，经验上限 18 个 → 推荐 ≤ 14。

| 数据库 | 推荐公式 | 说明 |
|--------|---------|------|
| PostgreSQL | < 2 × CPU + SSD | 进程模型 |
| MySQL | < 4 × CPU + SSD | 线程模型 |

- 500 个微服务各开 20 连接 = 10000 个连接打向数据库
- pgbouncer / ProxySQL：连接池中间件合并连接
- P99 延迟比平均延迟更重要——一个慢查询能占满整个池
