---
title: "Table"
category: Data
status: ready
order: 10
summary: "结构化表格，展示 columns / rows。"
---

# Table

根据实时 `.columns` 与 `.rows`/`.items` 数组渲染纯文本表格；这些数组必须通过 property 赋值，不能写成 JSON attribute。

## HTML 示例

```slex
<slex-table id="items"></slex-table>
<script type="module">
  const table = slex.root.querySelector("#items"); table.columns = [{ key: "name", label: "Name" }]; table.rows = [{ name: "Ada" }];
</script>
```

## API 参考

默认值描述省略属性时的渲染行为，不表示 property getter 必然返回相同值；`auto` 表示按说明推导。布尔属性按是否存在判断，数组通过 JavaScript property 传入。

| Property / 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `columns` | array | `[]` | 仅 property；列键或 { key, label, icon } 对象数组。 |
| `rows` | array | `[]` | 仅 property；行数据，包含空数组在内都优先于 items。 |
| `items` | array | `[]` | 仅 property；rows 未设置时使用的后备行数据。 |

## 接口摘要

- 属性: 无
- Properties: `columns`, `rows`, `items`
- Events: 无
- Slots: 无

准确类型与完整描述以 `dist/custom-elements.json` 为准。标量初值使用属性，数组/对象使用 JavaScript property，交互使用原生事件。
