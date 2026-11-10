---
title: AI / Agents
category: Guides
status: ready
order: 50
summary: "供 agents 使用的 LLM 文档、MCP、skills 与创作规则。"
slexkitRenderMode: component
---

# AI / Agents

Agent 应先阅读 `AGENTS.slexkit.md`、`docs/html-migration-contract.md`、`docs/web-components.md` 与 `dist/custom-elements.json`，并在明确的 `slex` 代码围栏中生成标准 HTML 和 JavaScript。

不要输出对象式 `g/layout` 源码、表达式属性、运行时 import、注册调用、外部脚本或未支持标签。使用 `slex.root`、作用域 `AbortSignal` `slex.signal`、`slex.onDispose`、显式快照钩子、经批准的 `slex.api` 与仅存 JSON 的 `slex.shared`。MCP 校验只做静态检查，绝不执行 payload 代码。

静态片段使用标量属性和 slot：

```slex
<slex-card title="构建状态" tone="success">
  <slex-row gap="3" align="center">
    <slex-badge text="就绪" tone="success"></slex-badge>
    <slex-link text="阅读 AI 索引" href="/llms.txt"></slex-link>
  </slex-row>
</slex-card>
```

数组通过 live property 赋值，交互使用原生事件。`slex.signal` 是当前作用域的 `AbortSignal`，不是响应式 signal 工厂，也不能传入初始值调用。

```slex
<slex-select id="format" label="格式"></slex-select>
<slex-text id="selection" text="请选择格式"></slex-text>
<script type="module">
  const format = slex.root.querySelector("#format");
  const selection = slex.root.querySelector("#selection");
  format.options = [
    { value: "html", label: "HTML" },
    { value: "markdown", label: "Markdown" }
  ];
  format.addEventListener("change", () => {
    selection.text = `已选择：${format.value}`;
  }, { signal: slex.signal });
</script>
```

静态检查期间生成源码必须保持惰性；只有隔离文档宿主提交后，运行时代码才会执行。
