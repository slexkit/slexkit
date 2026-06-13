---
title: 安全策略配置
category: 安全沙箱场景
status: published
order: 19
summary: 配置安全沙箱的权限策略，控制网络、存储、DOM、代码执行的访问权限。
tags: secure, policy, sandbox, security
components: section, card, callout, badge, grid, checkbox, select
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# 安全策略配置

不可信内容进入 sandbox 后，网络、存储、DOM、代码执行——每一项都需要宿主显式授权。这个面板让你逐项开关和配置策略模式。

```slex
{
  slex: "0.1",
  namespace: "secure_policy",
  g: {
    policies: {
      network: { enabled: true, mode: "allowlist" },
      storage: { enabled: false, mode: "readonly" },
      dom: { enabled: true, mode: "restricted" },
      eval: { enabled: false, mode: "none" }
    },
    togglePolicy: function (name) {
      this.policies[name].enabled = !this.policies[name].enabled;
    },
    setMode: function (name, mode) {
      this.policies[name].mode = mode;
    },
    enabledCount: function () {
      return Object.values(this.policies).filter(function (p) { return p.enabled; }).length;
    }
  },
  layout: {
    "section:policies": {
      eyebrow: "安全沙箱 · 策略配置",
      title: "安全策略矩阵",
      subtitle: "配置不同操作的权限控制。",
      "grid:matrix": {
        columns: 1, mdColumns: 2,
        "card:network": {
          title: "网络访问",
          "checkbox:enabled": { label: "启用", "$checked": "g.policies.network.enabled", onchange: "g.togglePolicy('network')" },
          "select:mode": {
            label: "模式",
            "$value": "g.policies.network.mode",
            options: [
              { label: "允许列表", value: "allowlist" },
              { label: "拒绝列表", value: "blocklist" },
              { label: "全部允许", value: "all" }
            ],
            onchange: "g.setMode('network', String($event))"
          }
        },
        "card:storage": {
          title: "存储访问",
          "checkbox:enabled": { label: "启用", "$checked": "g.policies.storage.enabled", onchange: "g.togglePolicy('storage')" },
          "select:mode": {
            label: "模式",
            "$value": "g.policies.storage.mode",
            options: [
              { label: "只读", value: "readonly" },
              { label: "读写", value: "readwrite" },
              { label: "无", value: "none" }
            ],
            onchange: "g.setMode('storage', String($event))"
          }
        },
        "card:dom": {
          title: "DOM 操作",
          "checkbox:enabled": { label: "启用", "$checked": "g.policies.dom.enabled", onchange: "g.togglePolicy('dom')" },
          "select:mode": {
            label: "模式",
            "$value": "g.policies.dom.mode",
            options: [
              { label: "受限", value: "restricted" },
              { label: "完全", value: "full" },
              { label: "无", value: "none" }
            ],
            onchange: "g.setMode('dom', String($event))"
          }
        },
        "card:eval": {
          title: "代码执行",
          "checkbox:enabled": { label: "启用", "$checked": "g.policies.eval.enabled", onchange: "g.togglePolicy('eval')" },
          "select:mode": {
            label: "模式",
            "$value": "g.policies.eval.mode",
            options: [
              { label: "无", value: "none" },
              { label: "受限", value: "restricted" },
              { label: "完全", value: "full" }
            ],
            onchange: "g.setMode('eval', String($event))"
          }
        }
      },
      "callout:summary": {
        tone: "info",
        "$text": "'已启用 ' + g.enabledCount() + '/4 项策略'"
      }
    }
  }
}
```

Fallback：网络 allowlist 启用，存储禁用，DOM restricted 启用，代码执行禁用。

## 安全策略参考

| 策略 | 默认值 | 风险等级 | 说明 |
|------|--------|----------|------|
| 网络 | 禁用 | 高 | 沙箱内默认禁止网络请求 |
| 存储 | 只读 | 中 | 可读取但不可写入 |
| DOM | 受限 | 中 | 仅限指定容器 |
| 代码执行 | 禁用 | 高 | 默认禁止 eval |
