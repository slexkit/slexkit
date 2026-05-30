---
title: 重试退避模拟
category: 软件工程
status: published
order: 21
summary: 调整基础延迟、退避倍数和抖动范围，观察指数退避策略下各次重试的延迟时间线。
tags: retry, backoff, reliability, distributed
components: card, input, slider, formula, stat, table, callout, grid, column
difficulty: 进阶
runtime: trusted
featured: false
slexkitRenderMode: component
---

# 重试退避模拟

分布式系统中没有"调用一定成功"的事。网络抖动、服务重启、GC 暂停——重试 + 退避是最简单有效的容错手段。

## 核心公式

$$\text{Delay}_n = \text{Base} \times \text{Multiplier}^{n-1} \times (1 \pm \frac{\text{Jitter}}{100})$$

```slex
{
  slex: "0.1",
  namespace: "example_retry_backoff_simulator",
  g: {
    baseDelay: 200, multiplier: 2, maxRetries: 5, jitter: 20,
    attempts: function () {
      var result = []; var cumulative = 0;
      for (var i = 0; i < this.maxRetries; i++) {
        var base = this.baseDelay * Math.pow(this.multiplier, i);
        var jitterRange = base * this.jitter / 100;
        var actual = Math.round(base + (Math.random() * 2 - 1) * jitterRange);
        cumulative += actual;
        result.push({ retry: i + 1, delay: actual, cumulative: cumulative });
      }
      return result;
    },
    totalTime: function () { var a = this.attempts(); return a.length > 0 ? a[a.length - 1].cumulative : 0; },
    lastDelay: function () { var a = this.attempts(); return a.length > 0 ? a[a.length - 1].delay : 0; }
  },
  layout: {
    "card:backoff": {
      title: "指数退避模拟",
      "grid:params": {
        columns: 1, mdColumns: 2,
        "column:baseField": { "input:baseDelay": { label: "基础延迟", "$value": "g.baseDelay", type: "number", unit: "ms", onchange: "g.baseDelay = Number($event || 0)" }, "slider:baseDelay": { label: "基础延迟", "$value": "g.baseDelay", min: 50, max: 5000, step: 50, unit: "ms", onchange: "g.baseDelay = Number($event)" } },
        "column:multField": { "input:multiplier": { label: "退避倍数", "$value": "g.multiplier", type: "number", unit: "x", onchange: "g.multiplier = Number($event || 0)" }, "slider:multiplier": { label: "退避倍数", "$value": "g.multiplier", min: 1, max: 5, step: 0.25, unit: "x", onchange: "g.multiplier = Number($event)" } },
        "column:retryField": { "input:maxRetries": { label: "最大重试", "$value": "g.maxRetries", type: "number", unit: "次", onchange: "g.maxRetries = Number($event || 0)" }, "slider:maxRetries": { label: "最大重试", "$value": "g.maxRetries", min: 1, max: 20, step: 1, unit: "次", onchange: "g.maxRetries = Number($event)" } },
        "column:jitterField": { "input:jitter": { label: "抖动范围", "$value": "g.jitter", type: "number", unit: "%", onchange: "g.jitter = Number($event || 0)" }, "slider:jitter": { label: "抖动", "$value": "g.jitter", min: 0, max: 50, step: 1, unit: "%", onchange: "g.jitter = Number($event)" } }
      },
      "formula:equation": { "$tex": "'\\\\text{Delay}_n = ' + g.baseDelay + ' \\\\times ' + g.multiplier + '^{n-1}'" },
      "grid:results": {
        columns: 1, mdColumns: 3,
        "stat:total": { label: "总等待时间", "$value": "g.totalTime()", unit: "ms" },
        "stat:lastDelay": { label: "最后等待", "$value": "g.lastDelay()", unit: "ms" },
        "callout:tip": { tone: "info", "$text": "g.jitter > 0 ? '抖动 ' + g.jitter + '% 可避免惊群效应。' : '无抖动时所有客户端重试同步。'" }
      }
    }
  }
}
```

Fallback：base=200ms, multiplier=2, 5 次重试 → 总等待约 6200ms。

| 策略 | Base | Mult | 场景 |
|------|------|------|------|
| 快速重试 | 10 ms | 1.5 | 内部 RPC |
| 标准退避 | 200 ms | 2 | HTTP API |
| 保守退避 | 1 s | 3 | 关键业务 |

- 惊群效应：大量客户端同时重试。解决方法 = 抖动 + 总请求量限制
- 幂等性：重试的前提。POST/PUT 必须带幂等键
- 总超时：上游还应有总超时上限
