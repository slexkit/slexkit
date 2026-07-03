---
title: "Column"
category: Layout
status: ready
order: 20
summary: "垂直排列子组件。适合表单、说明文字、控制组。"
---
# Column 列

基本垂直布局容器。

<!-- slex:spec-example:start component="column" id="basic" sourceHash="b28bf5e9" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_column_typical",
  "layout": {
    "column:form": {
      "input:name": {
        "placeholder": "姓名"
      },
      "input:email": {
        "placeholder": "邮箱"
      },
      "button:save": {
        "label": "保存"
      }
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：表单字段组、设置面板、说明文字段落、操作序列。
- 不适合：需要水平排列的场景（应当用 row）、等宽卡片网格（应当用 grid）。
- 关联组件：row 是水平排列，grid 是二维网格，column 只负责垂直方向。
- 应放置子组件作为字段，按需从上到下排列。
- 默认宽度填满父容器，高度由内容撑开。

## API 参考 {#api}

<!-- slex:spec-api:start component="column" sourceHash="5a83045d" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| 子组件 | object | 否 | 否 |  | 嵌套组件字段会按字段顺序渲染为子内容。 |
<!-- slex:spec-api:end -->
