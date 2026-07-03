---
title: 开始使用
category: Guides
status: ready
order: 20
summary: "安装 SlexKit，挂载第一个片段，并在 Markdown 中保留可读降级内容。"
slexkitRenderMode: component
---

# 开始使用

> 只想在 Obsidian 里直接安装插件？打开 **Settings -> Community plugins**，搜索 **SlexKit**，安装并启用即可。下面的内容用于网页、Markdown host、Streamdown 或自定义运行环境。

先安装 `slexkit`，挂载一个可信片段。确认基础渲染可用后，再接入 Markdown host、Streamdown 或 Obsidian 插件。

## 安装入口

对于大多数应用，通常从根包开始安装：

```sh
npm install slexkit
```

```ts
import { mount } from "slexkit";
import "slexkit/style.css";
```

需要单独安装某个宿主包时，按场景选择：

| 场景 | 安装 |
|---|---|
| 自定义组件或无组件运行时 | `npm install slexkit @slexkit/runtime` |
| 官方 Svelte 组件注册 | `npm install slexkit @slexkit/runtime @slexkit/components-svelte` |
| 独立 shadcn token 主题 CSS | `npm install @slexkit/theme-shadcn` |
| React + Streamdown Markdown 宿主 | `npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown streamdown react react-dom` |
| Obsidian vault 渲染 | 从 Obsidian Community Plugins 安装 **SlexKit** |

`@slexkit/runtime` 和 `@slexkit/components-svelte` 封装根包，不是独立实现包。

## 可信片段

先从 trusted mode 开始。它适合应用自己生成的 source、本地示例、仓库里的示例，以及已经审查过的片段。

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
      title: "计数器",
      "text:value": {
        "$text": "'计数：' + g.count"
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

Source 出现在 Markdown 中时，只处理显式 `slex` fence，并在 fence 后保留普通 Markdown fallback：

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

支持 SlexKit 的 host 会渲染 fence；普通 Markdown host 会显示 fallback。不要从 `js`、`json` 或未标记代码块中推断并执行 SlexKit source。

## Markdown 宿主

当产品要渲染聊天消息、文档页或长 Markdown 内容时，使用 `createSlexKitMarkdownRuntimeHost`。它让同一篇文档里的多个 `slex` 代码块共享状态，并提供统一的 cleanup 和 trusted/secure 切换。

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

## 内容来源

| 内容来源 | 使用 |
|---|---|
| 应用代码生成、仓库示例、本地 vault 内容 | trusted |
| 未审查用户输入、第三方 Markdown、agent 直接输出 | secure |

Secure mode 需要 sandbox iframe、公开可加载的 `slexkit.runtime.js` 以及 host policy。具体接入见 [安全运行时接入](security-runtime)。

## 继续阅读

- [集成](integration)：接入 React/Streamdown 与 Obsidian 插件
- [安全运行时接入](security-runtime)：渲染不可信或 agent 生成内容
- [组件文档](../components/card)：可公开使用的内置组件
- [AI / Agents](ai-agents)：给模型和 agent 提供 SlexKit authoring 上下文
