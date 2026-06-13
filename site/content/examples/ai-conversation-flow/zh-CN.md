---
title: AI 多轮对话状态管理
category: 高级示例
status: published
order: 25
summary: AI 多轮对话中的状态管理，用户可回溯和调整对话流程。
tags: ai, conversation, multi-turn, state-management
components: section, card, select, stat, badge, callout, grid, button
difficulty: 高级
runtime: trusted
featured: true
slexkitRenderMode: component
---

# AI 多轮对话状态管理

AI 引导你完成项目配置——问完规模问预算，问完预算问时间。每一步的选择都记录在 g 对象里，用户可以回溯、修改、重新计算。

```slex
{
  slex: "0.1",
  namespace: "ai_conversation",
  g: {
    currentStep: 1,
    totalSteps: 4,
    answers: { step1: "", step2: "", step3: "", step4: "" },
    questions: {
      step1: "你的项目规模有多大？",
      step2: "你的预算范围是多少？",
      step3: "你的时间要求是什么？",
      step4: "你的技术偏好是什么？"
    },
    options: {
      step1: ["小型（1-3 人）", "中型（4-10 人）", "大型（10+ 人）"],
      step2: ["< ¥50,000", "¥50,000 - ¥200,000", "> ¥200,000"],
      step3: ["1-3 个月", "3-6 个月", "6+ 个月"],
      step4: ["React", "Vue", "Svelte", "其他"]
    },
    selectAnswer: function (answer) {
      this.answers["step" + this.currentStep] = answer;
      if (this.currentStep < this.totalSteps) this.currentStep++;
    },
    goToStep: function (step) {
      if (step >= 1 && step <= this.totalSteps) this.currentStep = step;
    },
    reset: function () {
      this.currentStep = 1;
      this.answers = { step1: "", step2: "", step3: "", step4: "" };
    },
    isComplete: function () {
      return Object.values(this.answers).every(function (a) { return a !== ""; });
    },
    answerLabel: function (step) {
      return this.answers["step" + step] || "待填写";
    },
    answerTone: function (step) {
      return this.answers["step" + step] ? "success" : this.currentStep === step ? "info" : "default";
    }
  },
  layout: {
    "section:conversation": {
      eyebrow: "高级示例 · AI 对话",
      title: "AI 项目咨询对话",
      subtitle: "AI 引导你完成项目配置，多步骤联动。",
      "grid:progress": {
        columns: 1, mdColumns: 4,
        "stat:step1": { "$label": "'步骤 1'", "$value": "g.answerLabel(1)", "$tone": "g.answerTone(1)" },
        "stat:step2": { "$label": "'步骤 2'", "$value": "g.answerLabel(2)", "$tone": "g.answerTone(2)" },
        "stat:step3": { "$label": "'步骤 3'", "$value": "g.answerLabel(3)", "$tone": "g.answerTone(3)" },
        "stat:step4": { "$label": "'步骤 4'", "$value": "g.answerLabel(4)", "$tone": "g.answerTone(4)" }
      },
      "callout:question": { tone: "info", "$text": "g.questions['step' + g.currentStep]" },
      "grid:options": {
        columns: 1, mdColumns: 3,
        "button:opt1": { "$label": "g.options['step' + g.currentStep][0]", onclick: "g.selectAnswer(g.options['step' + g.currentStep][0])", "$disabled": "g.answers['step' + g.currentStep] === g.options['step' + g.currentStep][0]" },
        "button:opt2": { "$label": "g.options['step' + g.currentStep][1]", onclick: "g.selectAnswer(g.options['step' + g.currentStep][1])", "$disabled": "g.answers['step' + g.currentStep] === g.options['step' + g.currentStep][1]" },
        "button:opt3": { "$label": "g.options['step' + g.currentStep][2]", onclick: "g.selectAnswer(g.options['step' + g.currentStep][2])", "$disabled": "g.answers['step' + g.currentStep] === g.options['step' + g.currentStep][2]" }
      },
      "grid:nav": {
        columns: 1, mdColumns: 2,
        "button:prev": { label: "上一步", onclick: "g.goToStep(g.currentStep - 1)", "$disabled": "g.currentStep === 1" },
        "button:next": { label: "下一步", onclick: "g.goToStep(g.currentStep + 1)", "$disabled": "g.currentStep === g.totalSteps || !g.answers['step' + g.currentStep]" }
      },
      "button:reset": { label: "重新开始", onclick: "g.reset()" },
      "callout:summary": {
        "$tone": "g.isComplete() ? 'success' : 'info'",
        "$text": "g.isComplete() ? '配置完成：' + g.answers.step1 + ' | ' + g.answers.step2 + ' | ' + g.answers.step3 + ' | ' + g.answers.step4 : '请完成所有步骤'"
      }
    }
  }
}
```

Fallback：四步完成后显示配置摘要。

## 多轮对话状态管理

| 步骤 | 问题 | 选项 | 状态 |
|------|------|------|------|
| 1 | 项目规模 | 小型/中型/大型 | 待填写 |
| 2 | 预算范围 | <50k/50k-200k/>200k | 待填写 |
| 3 | 时间要求 | 1-3月/3-6月/6+月 | 待填写 |
| 4 | 技术偏好 | React/Vue/Svelte/其他 | 待填写 |
