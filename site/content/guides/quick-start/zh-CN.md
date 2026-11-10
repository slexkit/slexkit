---
title: 开始使用
category: Guides
status: ready
order: 20
summary: "安装 SlexKit，挂载第一个片段，并在 Markdown 中保留可读降级内容。"
slexkitRenderMode: component
---

# 开始使用

安装软件包，并配置由宿主掌控的 frame 运行时 URL。

```js
import { createSlexKitMarkdownRuntimeHost } from "slexkit/runtime";
const host = createSlexKitMarkdownRuntimeHost({ secureFrame: { runtimeUrl: "/slexkit.runtime.js", styleUrl: "/slexkit.css" } });
await host.updateArtifact("message-1", [{ artifactId: "message-1", blockId: "block-1", source, container }], { phase: "commit" });
```

```slex
<slex-card title="Counter"><slex-stat id="count" label="Count" value="0"></slex-stat><slex-button id="add" label="Add"></slex-button></slex-card>
<script type="module">
  const count = slex.root.querySelector("#count"); const add = slex.root.querySelector("#add");
  const click = () => { count.value = Number(count.value) + 1; }; add.addEventListener("click", click);
  slex.onDispose(() => add.removeEventListener("click", click));
</script>
```

为 block 以及需要保留的元素设置稳定 ID（元素使用 `id` 或 `data-key`）。preview 更新只校验，不运行新脚本；commit 更新才会在隔离文档中执行。
