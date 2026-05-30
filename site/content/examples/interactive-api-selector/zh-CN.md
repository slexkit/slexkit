---
title: 交互式 API 选择器
category: 平台能力与安全运行时
status: published
order: 9
summary: 按使用场景选择 SlexKit API，并展示对应代码片段和解释。
tags: api, docs, selector
components: card, select, code-block, callout
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 交互式 API 选择器

SlexKit 有三种接入方式，分别面向不同场景。不确定该用哪个？选一下就知道了。

```slex
{
  slex: "0.1",
  namespace: "example_interactive_api_selector",
  g: { mode: "markdown", snippet: function () { if (this.mode === "secure") return "mountSecureArtifact(source, container, { policy, frame })"; if (this.mode === "custom") return "register(type, renderer, { state })"; return "createSlexKitMarkdownRuntimeHost({ mode: 'trusted' })"; }, note: function () { if (this.mode === "secure") return "用于未审阅或用户生成的 Slex source。"; if (this.mode === "custom") return "用于扩展宿主自己的组件系统。"; return "用于 Markdown 渲染器中的显式 slex fence。"; } },
  layout: {
    "card:api": {
      title: "按场景选择 API",
      "select:mode": { label: "场景", "$value": "g.mode", options: [{ label: "Markdown 文档", value: "markdown" }, { label: "安全沙箱", value: "secure" }, { label: "自定义组件", value: "custom" }], onchange: "g.mode = String($event)" },
      "code-block:snippet": { language: "ts", "$code": "g.snippet()" },
      "callout:note": { tone: "info", "$text": "g.note()" }
    }
  }
}
```

切换场景，代码片段和说明会跟着变。三种模式的安全性、灵活性和复杂度各有不同：

| 场景 | API | 适用情况 |
|:---|:---|:---|
| Markdown 文档 | `createSlexKitMarkdownRuntimeHost` | 可信内容，slex fence 直接渲染 |
| 安全沙箱 | `mountSecureArtifact` | 未审阅/用户生成内容，需要隔离 |
| 自定义组件 | `register` | 宿主有自己的组件体系，需要桥接 |

Fallback：根据渲染场景选择 Markdown runtime host、secure runtime 或 registry API。
