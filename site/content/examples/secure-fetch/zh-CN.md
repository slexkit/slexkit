---
title: "安全网络请求"
category: "安全沙箱场景"
status: published
order: 18
summary: "在安全沙箱中通过 host policy 控制网络访问权限"
tags: secure, fetch, network, sandbox
components: section, card, callout, badge, button, select
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# 安全网络请求

安全运行时通过 host policy 控制网络访问权限，不可信内容只能访问授权的网络资源。下面的示例可以配置请求方法和策略模式，测试请求在不同策略下的行为。

---

## 网络请求演示

```slex
{
  slex: "0.1",
  namespace: "secure_fetch",
  g: {
    url: "https://api.example.com/data",
    method: "GET",
    policy: "allowlist",
    allowed: true,
    result: null,
    loading: false,
    error: null,
    sendRequest: function () {
      this.loading = true;
      this.error = null;
      this.result = null;

      // 模拟网络请求
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
      subtitle: "测试安全沙箱中的网络请求能力。",
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
        "select:policy": {
          label: "策略模式",
          "$value": "g.policy",
          options: [
            { label: "允许列表", value: "allowlist" },
            { label: "拒绝列表", value: "blocklist" },
            { label: "全部允许", value: "all" }
          ],
          onchange: "g.policy = String($event)"
        }
      },
      "callout:url": {
        tone: "info",
        "$text": "'目标 URL：' + g.url"
      },
      "grid:actions": {
        columns: 1, mdColumns: 2,
        "button:send": {
          label: "发送请求",
          onclick: "g.sendRequest()",
          "$disabled": "g.loading"
        },
        "button:toggle": {
          "$label": "g.allowed ? '禁止请求' : '允许请求'",
          onclick: "g.togglePolicy()"
        }
      },
      "callout:status": {
        "$tone": "g.loading ? 'info' : g.error ? 'danger' : g.result ? 'success' : 'info'",
        "$text": "g.loading ? '请求中...' : g.error ? g.error : g.result ? '请求成功：' + JSON.stringify(g.result.data) : '点击发送请求'"
      }
    }
  }
}
```

点击「禁止请求」后，再发送请求会模拟被 host policy 拦截的效果。

---

### Fallback

不支持 SlexKit 的环境会显示原始 DSL 代码块。
