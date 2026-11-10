---
title: "Playground"
category: Tooling
status: ready
order: 10
summary: "从 slexkit/tooling 显式注册的可选 HTML 编辑器与隔离预览。"
---

# Playground

`slex-playground` 是目录中可选的第 29 个元素，不会随 `defineSlexElements()` 一起注册，也不应由生成的 payload 代码注册。可信宿主需要显式启用它，并提供隔离运行时资源：

```js
import { defineSlexPlayground } from "slexkit/tooling";

defineSlexPlayground(window, {
  secureFrame: {
    runtimeUrl: "/assets/slexkit.runtime.js",
    styleUrl: "/assets/slexkit.css",
  },
});
```

`source` 字符串/property 用于设置编辑器内容。布尔 attribute `autorun` 会在初次连接时 commit 内容；未设置时，初始内容与输入变化只做 preview，直到用户点击 Run。预览与运行都复用其他集成所用的隔离 HTML 文档宿主。

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `source` | string | `""` | 可编辑 HTML 源码。赋值会更新编辑器并执行 preview 阶段渲染。 |
| `autorun` | boolean | `false` | 首次连接时以 commit 阶段运行源码；后续 source 变化仍使用 preview 阶段。 |

## 接口摘要

- 属性: `source`, `autorun`
- Properties: `source`, `autorun`
- Events: 无
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
