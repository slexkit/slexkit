---
title: JSONPlaceholder 网络请求实验台
category: 平台能力
status: published
order: 16
summary: 用 JSONPlaceholder 演示 secure runtime 如何把用户触发的网络请求交给 host policy 审核和代理。
tags: network, fetch, host-policy, jsonplaceholder
components: button, card, text
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# JSONPlaceholder 网络请求实验台

按钮调用受策略控制的 `slex.api.fetch`；URL 与请求是否获准由宿主判断，并返回可序列化结果。

```slex
<slex-card title="JSONPlaceholder 网络请求实验台"><slex-button id="load" label="加载"></slex-button><slex-text id="status" text="Idle"></slex-text></slex-card>
<script type="module">
  const load = slex.root.querySelector("#load"); const status = slex.root.querySelector("#status");
  const run = async () => { try { const result = await slex.api.fetch("https://jsonplaceholder.typicode.com/posts/1"); status.text = String(result.status); } catch (error) { status.text = error instanceof Error ? error.message : String(error); } };
  load.addEventListener("click", run); slex.onDispose(() => load.removeEventListener("click", run));
</script>
```

静态校验不会访问 JSONPlaceholder；请求只会在 commit 后由用户触发，并且必须先通过宿主桥接策略。
