---
title: 安全沙箱演示
category: 安全沙箱场景
status: published
order: 20
summary: 沙箱隔离效果演示，测试不同操作在沙箱内外的访问权限差异。
tags: secure, sandbox, isolation, security
components: section, card, callout, badge, grid, button
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# 安全沙箱演示

不可信内容进入 sandbox iframe 后，DOM、网络、存储都被隔离——这个面板让你测试不同操作的访问权限，直观感受沙箱的隔离效果。

```slex
{
  slex: "0.1",
  namespace: "secure_sandbox",
  g: {
    sandboxEnabled: true,
    testResults: [],
    runTest: function (testName) {
      var result = {
        name: testName,
        status: this.sandboxEnabled ? "隔离" : "未隔离",
        timestamp: new Date().toLocaleTimeString()
      };
      this.testResults.push(result);
    },
    clearResults: function () {
      this.testResults = [];
    },
    toggleSandbox: function () {
      this.sandboxEnabled = !this.sandboxEnabled;
    }
  },
  layout: {
    "section:sandbox": {
      eyebrow: "安全沙箱 · 隔离演示",
      title: "沙箱隔离效果",
      subtitle: "测试不同操作在沙箱内外的访问权限差异。",
      "grid:controls": {
        columns: 1, mdColumns: 3,
        "button:testDom": { label: "测试 DOM 访问", onclick: "g.runTest('DOM')" },
        "button:testNetwork": { label: "测试网络请求", onclick: "g.runTest('Network')" },
        "button:testStorage": { label: "测试存储访问", onclick: "g.runTest('Storage')" }
      },
      "grid:actions": {
        columns: 1, mdColumns: 2,
        "button:toggle": { "$label": "g.sandboxEnabled ? '禁用沙箱' : '启用沙箱'", onclick: "g.toggleSandbox()" },
        "button:clear": { label: "清除结果", onclick: "g.clearResults()" }
      },
      "callout:status": {
        "$tone": "g.sandboxEnabled ? 'success' : 'warning'",
        "$text": "g.sandboxEnabled ? '沙箱已启用：所有操作都被隔离' : '沙箱禁用：操作直接访问宿主环境'"
      },
      "card:results": {
        title: "测试结果",
        "callout:list": {
          tone: "info",
          "$text": "g.testResults.length > 0 ? g.testResults.map(function(r) { return r.name + ': ' + r.status + ' (' + r.timestamp + ')'; }).join('\\n') : '点击上方按钮运行测试'"
        }
      }
    }
  }
}
```

Fallback：启用沙箱时，DOM/网络/存储访问被隔离；禁用时，直接访问宿主环境。

## 沙箱隔离能力

| 操作 | 沙箱内 | 沙箱外 |
|------|--------|--------|
| DOM 访问 | 隔离在 iframe | 直接访问 |
| 网络请求 | 被 host policy 控制 | 自由访问 |
| 存储访问 | 受限 | 自由读写 |
| 代码执行 | 受限 | 自由执行 |
