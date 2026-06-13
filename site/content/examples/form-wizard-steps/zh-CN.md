---
title: "多步骤配置向导"
category: "配置向导"
status: published
order: 12
summary: "多步骤表单配方——分步填写、进度追踪、步骤校验、最终确认的完整工作流。"
tags: form, wizard, multi-step, validation
components: section, card, input, select, checkbox, submit, progress, toast, badge, callout, grid, column, radio-group
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 多步骤配置向导

很多产品配置不是填一个表单就能完成的——开发环境选择、资源配置、安全策略、发布确认，每一步需要不同的输入。可以用 `g.step` 追踪当前步骤 + `$if` 按步骤渲染组件。

```slex
{
  slex: "0.1",
  namespace: "example_form_wizard",
  g: {
    step: 1, env: "staging", region: "us-east-1", cores: 2, memory: 4,
    enableAuth: true, enableLogging: true, confirmed: false,
    stepValid: function () {
      if (this.step === 1) return Boolean(this.env && this.region);
      if (this.step === 2) return this.cores >= 1 && this.memory >= 1;
      return true;
    },
    next: function () { if (this.stepValid() && this.step < 4) { this.step = this.step + 1; } },
    prev: function () { if (this.step > 1) { this.step = this.step - 1; } },
    progress: function () { return (this.step - 1) / 3 * 100; },
    submit: function () { this.confirmed = true; }
  },
  layout: {
    "section:wizard": {
      eyebrow: "配置向导",
      title: "新建部署环境",
      subtitle: "共 4 步：基础信息 → 资源配置 → 安全策略 → 确认发布。",
      "progress:steps": { label: "步骤进度", "$value": "g.progress()" },
      "card:step1": {
        "$if": "g.step === 1",
        title: "步骤 1：基础信息",
        "input:env": { label: "环境名称", "$value": "g.env", type: "text", placeholder: "staging / production", onchange: "g.env = String($event || '')" },
        "select:region": { label: "部署区域", "$value": "g.region", options: [{ label: "美东 (us-east-1)", value: "us-east-1" }, { label: "美西 (us-west-2)", value: "us-west-2" }, { label: "亚太 (ap-southeast-1)", value: "ap-southeast-1" }], onchange: "g.region = String($event)" }
      },
      "card:step2": {
        "$if": "g.step === 2",
        title: "步骤 2：资源配置",
        "slider:cores": { label: "CPU 核心", "$value": "g.cores", min: 1, max: 16, step: 1, unit: "核", onchange: "g.cores = Number($event)" },
        "slider:memory": { label: "内存", "$value": "g.memory", min: 1, max: 64, step: 1, unit: "GB", onchange: "g.memory = Number($event)" },
        "callout:cost": { tone: "info", "$text": "'预估月成本约 $' + (g.cores * 15 + g.memory * 3) + '。'" }
      },
      "card:step3": {
        "$if": "g.step === 3",
        title: "步骤 3：安全策略",
        "checkbox:auth": { label: "启用身份认证", "$checked": "g.enableAuth", onchange: "g.enableAuth = Boolean($event)" },
        "checkbox:logging": { label: "启用审计日志", "$checked": "g.enableLogging", onchange: "g.enableLogging = Boolean($event)" },
        "callout:sec": { "$tone": "g.enableAuth ? 'success' : 'warning'", "$text": "g.enableAuth ? '认证已启用，推荐配置。' : '建议启用身份认证。'" }
      },
      "card:step4": {
        "$if": "g.step === 4",
        title: "步骤 4：确认发布",
        "grid:summary": {
          columns: 1, mdColumns: 3,
          "stat:env": { label: "环境", "$value": "g.env" },
          "stat:region": { label: "区域", "$value": "g.region" },
          "stat:cpu": { label: "CPU", "$value": "g.cores + ' 核'" }
        },
        "grid:summary2": {
          columns: 1, mdColumns: 3,
          "stat:memory": { label: "内存", "$value": "g.memory + ' GB'" },
          "stat:auth": { label: "认证", "$value": "g.enableAuth ? '已启用' : '未启用'" },
          "stat:logging": { label: "日志", "$value": "g.enableLogging ? '已启用' : '未启用'" }
        },
        "submit:confirm": { label: "确认并发布", onclick: "g.submit()" }
      },
      "grid:nav": {
        columns: 2,
        "submit:prev": { "$if": "g.step > 1", label: "上一步", onclick: "g.prev()" },
        "submit:next": { "$if": "g.step < 4", "$disabled": "!g.stepValid()", label: "下一步", onclick: "g.next()" }
      },
      "toast:done": { "$if": "g.confirmed", type: "success", title: "部署已提交", icon: "check-circle", "$description": "'环境 ' + g.env + ' 将在 ' + g.region + ' 区域创建。'" }
    }
  }
}
```

**这个示例展示了分步骤设计的关键技巧：**

- `g.step` 是步骤指针，`$if` 按步骤显示对应 card
- `stepValid()` 校验当前步骤是否可进入下一步
- `progress()` 计算总进度给 progress 组件
- `prev()` / `next()` 方法通过 onclick 驱动步骤切换
- 最终确认步骤用 submit 提交，触发 toast 通知

这种模式广泛适用于：部署配置向导、问卷调研、多页注册、课程注册选课。

---

Fallback：环境选 staging，区域选美东，2 核 4GB，启用认证和日志。多步骤逐步引导用户完成配置。
