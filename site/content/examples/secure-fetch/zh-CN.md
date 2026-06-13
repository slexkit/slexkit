---
title: 安全网络请求
category: 安全沙箱场景
status: published
order: 18
summary: 安全沙箱中的网络请求能力，通过 host policy 控制网络访问权限。
tags: secure, fetch, network, sandbox
components: section, card, callout, badge, button, select
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# 安全网络请求

不可信内容进入 sandbox iframe 后，网络请求默认被阻断。宿主通过 policy 矩阵决定哪些 URL 可以放行——全部拒绝、允许列表、或者完全放开。

```slex
{
  slex: "0.1",
  namespace: "secure_fetch",
  g: {
    url: "https://api.example.com/data",
    method: "GET",
    allowed: true,
    result: null,
    loading: false,
    error: null,
    sendRequest: function () {
      this.loading = true;
      this.error = null;
      this.result = null;
      var self = this;
      setTimeout(function () {
        self.loading = false;
        if (self.allowed) {
          self.result = { status: 200, data: { message: "请求成功", timestamp: new Date().toISOString() } };
        } else {
          self.error = "请求被 host policy 阻止：URL 不在允许列表中";
        }
      }, 1000);
    },
    togglePolicy: function () {
      this.allowed = !this.allowed;
    }
  },
  layout: {
    "section:fetch": {
      eyebrow: "安全沙箱 · 网络请求",
      title: "网络请求演示",
      subtitle: "沙箱内发起请求，host policy 决定是否放行。",
      "grid:config": {
        columns: 1, mdColumns: 2,
        "select:method": {
          label: "请求方法",
          "$value": "g.method",
          options: [
            { label: "GET", value: "GET" },
            { label: "POST", value: "POST" },
            { label: "PUT", value: "PUT" },
            { label: "DELETE", value: "DELETE" }
          ],
          onchange: "g.method = String($event)"
        },
        "button:send": { label: "发送请求", onclick: "g.sendRequest()", "$disabled": "g.loading" },
        "button:toggle": { "$label": "g.allowed ? '禁止请求' : '允许请求'", onclick: "g.togglePolicy()" }
      },
      "callout:status": {
        "$tone": "g.loading ? 'info' : g.error ? 'danger' : g.result ? 'success' : 'info'",
        "$text": "g.loading ? '请求中...' : g.error ? g.error : g.result ? '请求成功：' + JSON.stringify(g.result.data) : '点击发送请求'"
      }
    }
  }
}
```

Fallback：允许模式下返回 200，禁止模式下返回 policy 拒绝错误。

## 安全沙箱能力矩阵

| 能力 | 默认策略 | 宿主责任 |
|------|----------|----------|
| DOM | 隔离在 iframe | 限制可见容器和销毁生命周期 |
| 网络 | 默认不直连 | 通过 allowlist 与超时策略代理 |
| 存储 | 只读 | 限制写入范围 |
| 工具调用 | 默认不执行 | 转成审批事件而不是直接调用 |
