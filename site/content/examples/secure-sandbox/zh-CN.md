---
title: "安全沙箱演示"
category: "安全沙箱场景"
status: published
order: 20
summary: "测试安全沙箱对 DOM、网络、存储等操作的隔离效果"
tags: secure, sandbox, isolation, security
components: card, callout, badge, section, grid, button
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# 安全沙箱演示

安全运行时将不可信内容隔离在沙箱 iframe 中，防止恶意代码影响宿主页面。下面的示例可以测试 DOM 访问、网络请求、存储操作在沙箱中的隔离状态。

---

## 沙箱隔离演示

```slex
{
  slex: "0.1",
  namespace: "secure_sandbox",
  g: {
    sandboxEnabled: true,
    content: "这段内容运行在沙箱中",
    testResults: [],
    runTest: function (testName) {
      const result = {
        name: testName,
        status: this.sandboxEnabled ? "隔离" : "未隔离",
        timestamp: new Date().toLocaleTimeString()
      };
      this.testResults.push(result);
    },
    clearResults: function () {
      this.testResults = [];
    }
  },
  layout: {
    "section:sandbox": {
      eyebrow: "安全沙箱 · 隔离演示",
      title: "沙箱隔离效果",
      subtitle: "直观展示不可信内容的隔离效果。",
      "grid:controls": {
        columns: 1, mdColumns: 2,
        "button:testDom": {
          label: "测试 DOM 访问",
          onclick: "g.runTest('DOM')"
        },
        "button:testNetwork": {
          label: "测试网络请求",
          onclick: "g.runTest('Network')"
        },
        "button:testStorage": {
          label: "测试存储访问",
          onclick: "g.runTest('Storage')"
        },
        "button:clear": {
          label: "清除结果",
          onclick: "g.clearResults()"
        }
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

点击测试按钮后，结果会记录到下方列表中，显示每项操作的隔离状态和时间戳。

---

### Fallback

不支持 SlexKit 的环境会显示原始 DSL 代码块。
