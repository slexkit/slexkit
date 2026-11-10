---
title: "Artifact 共享 JSON 实验室"
category: "平台能力"
status: published
order: 15
summary: "通过 artifact-local slex.shared 发布和订阅有界 JSON，而不共享 DOM 或模块全局对象。"
tags: artifact, shared-json, subscription
components: card, input, text
difficulty: 入门
runtime: secure
featured: true
slexkitRenderMode: component
---

# Artifact 共享 JSON 实验室

输入框通过 `slex.shared` 发布 JSON 字符串，订阅回调再显示 artifact-local 值；各 fence 不会因此共享 DOM 或模块全局对象。

```slex
<slex-card title="Artifact 共享 JSON 实验室"><slex-input id="name" label="共享名称" value="SlexKit"></slex-input><slex-text id="mirror"></slex-text></slex-card>
<script type="module">
  const input = slex.root.querySelector("#name"); const mirror = slex.root.querySelector("#mirror");
  const publish = () => slex.shared.set("name", input.value); const unsubscribe = slex.shared.subscribe("name", (value) => { mirror.text = String(value ?? ""); });
  input.addEventListener("input", publish); publish(); slex.onDispose(() => { input.removeEventListener("input", publish); unsubscribe(); });
</script>
```

模块作用域被替换时，订阅与输入监听器都会通过 `slex.onDispose` 释放。
