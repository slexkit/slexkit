---
title: 安全运行时接入
category: Guides
status: ready
order: 40
summary: "用 secure mode 渲染未审查用户输入、第三方 Markdown 或 agent 输出。"
slexkitRenderMode: component
---

# 安全运行时接入

当宿主不能完全控制 Slex source 时，应使用 secure mode：未经审查的用户输入、第三方 Markdown、agent 直接输出，或作者不明确的共享文档。

Secure mode 需要同时配置部署和 policy。威胁模型、`HostRuntimePolicy`、sandbox 属性、bridge 消息和 fail-closed 行为见 [安全运行时契约](/docs/reference/security)。

## 什么时候用 secure

| Source | 使用 | 说明 |
|---|---|---|
| 应用代码生成的 source | trusted | source 由应用代码产生。 |
| 仓库示例或已审查片段 | trusted | 示例应保持显式和版本化。 |
| 本地 Obsidian vault 笔记 | trusted readonly | Obsidian 插件不提供 sandbox 隔离。 |
| 用户提交的 Markdown | secure | 即使 Markdown 看起来无害，也按不可信处理。 |
| Agent 直接输出 | secure | 默认不要授权网络、定时器、动画或 canvas。 |

如果无法明确判断，先使用 secure mode，只在宿主有具体产品需求时再开启能力。

## 最小宿主接入

Markdown 宿主优先使用 `createSlexKitMarkdownRuntimeHost`。同一篇文档里的多个 `slex` 代码块可以共享状态，block cleanup 和 secure frame 挂载也都放在这里处理。

```ts
import { createSlexKitMarkdownRuntimeHost } from "slexkit";
import "slexkit/style.css";

const runtime = createSlexKitMarkdownRuntimeHost({
  mode: "secure",
  theme: "host-shadcn",
  secureFrame: {
    runtimeUrl: "/slexkit.runtime.js"
  },
  policy: {
    execution: {
      heartbeatIntervalMs: 1000,
      maxUnresponsiveMs: 30000
    }
  }
});

export function mountSlexFence(source: string, container: HTMLElement) {
  return runtime.mountBlock({
    artifactId: "message-42",
    source,
    container
  });
}
```

单个 fence 消失时调用 `disposeBlock(container)`；整条消息、文档或笔记销毁时调用 `disposeArtifact(artifactId)`。

省略的能力 policy 默认拒绝访问。只有当宿主明确启用某项能力时，才添加 `network`、`timer`、`animation` 或 `canvas` policy 对象。

## Runtime Module

Secure iframe 会从 `secureFrame.runtimeUrl` 导入运行时。这个文件必须作为公开 ES module 提供：

```http
Access-Control-Allow-Origin: *
Content-Type: text/javascript
```

这是服务器或部署层配置。请求失败后，前端 JavaScript 不能再补救这些响应头。

## Policy 设置

- 除非有明确产品功能需要，否则保持网络禁用。
- 如果开启 network，只允许必要 method、origin、header、body 大小、response 大小和 content type。
- 除非 Slex source 需要，否则保持 timer、animation 和 canvas 禁用。
- 不要把 Slex source 内的 `capabilities`、`permissions`、`api` 等字段当作授权来源。
- 不要为了修复 CORS 或调试问题添加 `allow-same-origin`。
- 运行时无响应时，应保留内置的可见 fail-closed 诊断。

Policy 字段和 adapter hooks 见 [安全运行时契约](/docs/reference/security)。

## 宿主说明

`@slexkit/streamdown` 可以运行 trusted 或 secure。聊天消息和 agent 输出默认使用 secure mode，除非宿主已经信任这条消息的来源。

官方 Obsidian 插件按本地 vault 内容处理，不应用来隔离第三方 Markdown 或 agent 直接输出。

自定义 Markdown 宿主仍然只应处理语言标记为 `slex` 的 fence，并为不支持 SlexKit 的环境保留可读的 Markdown fallback。

## 上线检查

- 每条消息、文档或笔记使用稳定 `artifactId`
- 只检测显式 `slex` fence
- 公开 `slexkit.runtime.js` ES module，并配置 CORS 与 JavaScript content type
- Host policy 默认拒绝
- Block 移除和 artifact 销毁时清理运行时
- 每个交互 fence 后保留可读 fallback
- 已核对 policy、bridge、CSP 和 sandbox 细节
