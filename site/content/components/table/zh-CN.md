---
title: "Table"
category: Data
status: ready
order: 10
summary: "结构化表格，展示 columns / rows。"
---
# Table 表格

结构化的行列数据展示，通过 columns 定义表头、rows 提供数据行。

<!-- slex:spec-example:start component="table" id="basic" sourceHash="8491bf94" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_table_typical",
  "layout": {
    "table:routes": {
      "columns": [
        {
          "key": "name",
          "label": "Name",
          "icon": "text-t"
        },
        {
          "key": "status",
          "label": "Status",
          "icon": "check-circle"
        }
      ],
      "rows": [
        {
          "name": "Parse",
          "status": "ready"
        },
        {
          "name": "Publish",
          "status": "pending"
        }
      ]
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：数据列表、配置表、结构化信息展示。
- 不适合：卡片式布局（应当用 grid）。
- 关联组件：grid 用于等宽卡片布局。
- columns 的 key 与 rows 中每项的字段名对应。

## API 参考 {#api}

<!-- slex:spec-api:start component="table" sourceHash="9a408c2a" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `columns` | array | 否 | 否 |  | 列定义，包含 key、label 和可选 icon。 |
| `columns[].icon` | string | 否 | 否 |  | 显示在列标签前的图标名称。 |
| `rows` | array | 否 | 否 |  | 按列 key 对齐的行数据对象。 |
| `items` | array | 否 | 否 |  | rows 的别名。 |
<!-- slex:spec-api:end -->
