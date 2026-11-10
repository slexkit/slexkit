---
title: "Code Block"
category: Content
status: ready
order: 50
summary: "代码或配置片段展示。"
---

# Code Block

展示代码或预格式化文本，可标注语言与标题；它只负责显示，不会执行其中脚本。

## HTML 示例

```slex
<slex-code-block></slex-code-block>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `code` | string | `""` | 主要代码源。 |
| `content` | string | `""` | 备用代码源字段；从 light DOM 推导的 code 优先使用，建议使用 code 或元素文本。 |
| `language` | string | `""` | 语言标签与语法高亮提示；不支持的名称会按纯文本代码渲染。 |
| `title` | string | `""` | 可选标题说明。 |

## 接口摘要

- 属性: `code`, `content`, `language`, `title`
- Properties: `code`, `content`, `language`, `title`
- Events: 无
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
