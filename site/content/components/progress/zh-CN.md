---
title: "Progress"
category: Feedback
status: ready
order: 10
summary: "进度条。"
---
# Progress 进度

展示任务完成进度，通过 value 控制百分比。

<!-- slex:spec-example:start component="progress" id="basic" sourceHash="d5fe2c3c" -->
```slex
{
  "slex": "0.1",
  "namespace": "doc_progress_typical",
  "layout": {
    "progress:build": {
      "label": "构建进度",
      "icon": "gear-six",
      "value": 64
    }
  }
}
```
<!-- slex:spec-example:end -->

## 使用提示

- 适合：构建进度、上传进度、任务完成度。
- 不适合：不确定时长的等待。
- 关联组件：stat 用于展示最终数值指标。
- value 范围建议 0-100。

## API 参考 {#api}

<!-- slex:spec-api:start component="progress" sourceHash="a6111bbf" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `value` | number | 否 | 是 | `0` | 0 到 100 的进度百分比。 |
| `label` | string | 否 | 是 |  | 进度标签。 |
| `icon` | string | 否 | 否 |  | 显示在标签前的图标名称。 |
| `indeterminate` | boolean | 否 | 是 | `false` | 渲染不带 aria-valuenow 的不确定进度状态。 |
<!-- slex:spec-api:end -->
