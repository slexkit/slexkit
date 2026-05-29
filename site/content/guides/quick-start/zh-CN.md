---
title: 开始使用
category: Guides
status: ready
order: 20
summary: "面向开发者的 SlexKit 集成入口：安装运行时、挂载可信片段、接入 Markdown host，并选择后续集成方式。"
slexkitRenderMode: component
---

# 开始使用

安装 `slexkit`，挂载一个可信片段，即可开始使用。后续可接入 Markdown host、Streamdown 或 Obsidian 插件。本文跳过这些集成细节，聚焦核心集成路径。

## 安装入口

对于大多数应用，通常从根包开始安装：

```sh
npm install slexkit
```

```ts
import { mount } from "slexkit";
import "slexkit/style.css";
```

需要更明确的包边界时，可按宿主选择 scoped packages：

| 场景 | 安装 |
|---|---|
| 自定义组件或无组件运行时 | `npm install slexkit @slexkit/runtime` |
| 官方 Svelte 组件注册 | `npm install slexkit @slexkit/runtime @slexkit/components-svelte` |
| 独立 shadcn token 主题 CSS | `npm install @slexkit/theme-shadcn` |
| React + Streamdown Markdown host | `npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown streamdown react react-dom` |
| Obsidian vault 渲染 | `npm install slexkit @slexkit/obsidian` |

`@slexkit/runtime` 和 `@slexkit/components-svelte` 是根包的 thin wrapper，不是独立实现包。

## 可信片段

Trusted mode 是最小集成路径，适用于应用自生成 source、本地示例、仓库维护内容和已审查片段。

```ts
import { mount } from "slexkit";
import "slexkit/style.css";

const source = {
  namespace: "getting_started_counter",
  g: {
    count: 0
  },
  layout: {
    "card:demo": {
      title: "Counter",
      "text:value": {
        "$text": "'Count: ' + g.count"
      },
      "button:add": {
        label: "+1",
        onclick: "g.count++"
      }
    }
  }
};

const cleanup = mount(source, document.getElementById("app")!);
```

移除容器、替换消息或卸载页面时调用 `cleanup()`。不再使用同一 namespace 时调用 `disposeNamespace(namespace)`。

## Markdown 降级

Source 出现在 Markdown 中时，仅处理显式 `slex` fence，并在 fence 后保留普通 Markdown fallback：

````md
```slex
{
  namespace: "release_status",
  layout: {
    "badge:status": { label: "Ready", tone: "success" },
    "text:summary": { text: "3 of 3 checks passed." }
  }
}
```

**Release status:** Ready. 3 of 3 checks passed.
````

支持 SlexKit 的 host 渲染 fence；普通 Markdown host 显示 fallback。不应从 `js`、`json` 或未标记代码块中推断并执行 SlexKit source。

## Markdown 宿主

产品渲染聊天消息、文档页或长 Markdown artifact 时，推荐使用 `createSlexKitMarkdownRuntimeHost`。它负责 artifact 作用域、block 生命周期、state-only fence 和 trusted/secure 模式切换。

```ts
import { createSlexKitMarkdownRuntimeHost } from "slexkit";
import "slexkit/style.css";

const runtime = createSlexKitMarkdownRuntimeHost({
  mode: "trusted",
  theme: "host-shadcn"
});

export function mountSlexFence(source: string, container: HTMLElement) {
  return runtime.mountBlock({
    artifactId: "message-42",
    source,
    container
  });
}
```

整篇文档或消息线程销毁时，调用 `runtime.disposeArtifact(artifactId)` 或 `runtime.disposeAll()`。

## 可信边界

| 内容来源 | 推荐模式 |
|---|---|
| 应用代码生成、仓库维护示例、本地 vault 内容 | trusted |
| 未审查用户输入、第三方 Markdown、agent 直接输出 | secure |

Secure mode 需要 sandbox iframe、公开可加载的 `slexkit.runtime.js` 以及 host policy。具体接入见 [安全运行时接入](security-runtime)。

## 后续路径

- [集成](integration)：接入 React/Streamdown 与 Obsidian 插件
- [安全运行时接入](security-runtime)：渲染不可信或 agent 生成内容
- [组件文档](../components/card)：可公开使用的内置组件
- [AI / Agents](ai-agents)：给模型和 agent 提供 SlexKit authoring 上下文
