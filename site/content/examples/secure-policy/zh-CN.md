---
title: "安全策略配置"
category: "安全沙箱场景"
status: published
order: 19
summary: "配置安全沙箱中不同操作的权限控制策略"
tags: secure, policy, sandbox, security
components: card, callout, badge, section, grid, checkbox, select
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# 安全策略配置

安全运行时需要对网络访问、存储、DOM 操作、代码执行等能力分别配置权限。下面的示例提供了一个策略矩阵界面，可以为每种操作启用或禁用权限，并选择具体的策略模式。

---

## 策略矩阵

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
          "checkbox:enabled": {
            label: "启用",
            "$checked": "g.policies.network.enabled",
            onchange: "g.togglePolicy('network')"
          },
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
          "checkbox:enabled": {
            label: "启用",
            "$checked": "g.policies.storage.enabled",
            onchange: "g.togglePolicy('storage')"
          },
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
          "checkbox:enabled": {
            label: "启用",
            "$checked": "g.policies.dom.enabled",
            onchange: "g.togglePolicy('dom')"
          },
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
          "checkbox:enabled": {
            label: "启用",
            "$checked": "g.policies.eval.enabled",
            onchange: "g.togglePolicy('eval')"
          },
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
        "$text": "'当前策略：网络 ' + (g.policies.network.enabled ? '启用' : '禁用') + '，存储 ' + (g.policies.storage.enabled ? '启用' : '禁用') + '，DOM ' + (g.policies.dom.enabled ? '启用' : '禁用') + '，代码执行 ' + (g.policies.eval.enabled ? '启用' : '禁用')"
      }
    }
  }
}
```

切换任意操作的启用状态或模式后，底部的策略摘要会实时更新。

---

### Fallback

不支持 SlexKit 的环境会显示原始 DSL 代码块。
