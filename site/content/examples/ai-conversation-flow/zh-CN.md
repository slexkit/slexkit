---
title: "AI 多轮对话状态管理"
category: "高级示例"
status: published
order: 25
summary: "展示 AI 多轮对话中的状态管理，用户可回溯和调整对话流程。"
tags: ai, conversation, multi-turn, state-management
components: section, card, slider, select, stat, badge, callout, grid, tabs, button
difficulty: 高级
runtime: trusted
featured: true
slexkitRenderMode: component
---

# AI 多轮对话状态管理

这是高级示例中的 AI 回答场景：**AI 多轮对话中的状态管理**。

---

## 对话状态面板

```slex
{
  slex: "0.1",
  namespace: "ai_conversation",
  g: {
    currentStep: 1,
    totalSteps: 4,
    answers: {
      step1: "",
      step2: "",
      step3: "",
      step4: ""
    },
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
    nextStep: function () {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
      }
    },
    prevStep: function () {
      if (this.currentStep > 1) {
        this.currentStep--;
      }
    },
    selectAnswer: function (answer) {
      this.answers['step' + this.currentStep] = answer;
      if (this.currentStep < this.totalSteps) {
        this.nextStep();
      }
    },
    reset: function () {
      this.currentStep = 1;
      this.answers = { step1: "", step2: "", step3: "", step4: "" };
    },
    isComplete: function () {
      return Object.values(this.answers).every(function(a) { return a !== ""; });
    },
    summary: function () {
      return this.answers.step1 + ' | ' + this.answers.step2 + ' | ' + this.answers.step3 + ' | ' + this.answers.step4;
    }
  },
  layout: {
    "section:conversation": {
      eyebrow: "高级示例 · AI 对话",
      title: "AI 项目咨询对话",
      subtitle: "AI 引导你完成项目配置，多步骤联动。",
      "grid:progress": {
        columns: 1, mdColumns: 4,
        "stat:step1": {
          label: "步骤 1",
          "$value": "g.answers.step1 || '待填写'",
          "$tone": "g.answers.step1 ? 'success' : g.currentStep === 1 ? 'info' : 'default'"
        },
        "stat:step2": {
          label: "步骤 2",
          "$value": "g.answers.step2 || '待填写'",
          "$tone": "g.answers.step2 ? 'success' : g.currentStep === 2 ? 'info' : 'default'"
        },
        "stat:step3": {
          label: "步骤 3",
          "$value": "g.answers.step3 || '待填写'",
          "$tone": "g.answers.step3 ? 'success' : g.currentStep === 3 ? 'info' : 'default'"
        },
        "stat:step4": {
          label: "步骤 4",
          "$value": "g.answers.step4 || '待填写'",
          "$tone": "g.answers.step4 ? 'success' : g.currentStep === 4 ? 'info' : 'default'"
        }
      },
      "callout:question": {
        tone: "info",
        "$text": "g.questions['step' + g.currentStep]"
      },
      "grid:options": {
        columns: 1, mdColumns: 3,
        "button:opt1": {
          "$label": "g.options['step' + g.currentStep][0]",
          onclick: "g.selectAnswer(g.options['step' + g.currentStep][0])",
          "$disabled": "g.answers['step' + g.currentStep] === g.options['step' + g.currentStep][0]"
        },
        "button:opt2": {
          "$label": "g.options['step' + g.currentStep][1]",
          onclick: "g.selectAnswer(g.options['step' + g.currentStep][1])",
          "$disabled": "g.answers['step' + g.currentStep] === g.options['step' + g.currentStep][1]"
        },
        "button:opt3": {
          "$label": "g.options['step' + g.currentStep][2]",
          onclick: "g.selectAnswer(g.options['step' + g.currentStep][2])",
          "$disabled": "g.answers['step' + g.currentStep] === g.options['step' + g.currentStep][2]"
        }
      },
      "grid:nav": {
        columns: 1, mdColumns: 3,
        "button:prev": {
          label: "上一步",
          onclick: "g.prevStep()",
          "$disabled": "g.currentStep === 1"
        },
        "button:reset": {
          label: "重新开始",
          onclick: "g.reset()"
        },
        "button:next": {
          label: "下一步",
          onclick: "g.nextStep()",
          "$disabled": "g.currentStep === g.totalSteps || !g.answers['step' + g.currentStep]"
        }
      },
      "callout:summary": {
        "$tone": "g.isComplete() ? 'success' : 'info'",
        "$text": "g.isComplete() ? '配置完成！' + g.summary() : '请完成所有步骤'"
      }
    }
  }
}
```

**关键点：**
- 展示 AI 多轮对话的状态管理
- 用户可回溯和调整对话流程
- 步骤进度和答案的实时联动
- 适合配置向导、问卷调查、交互式教程

---

### Fallback 文本

如果不支持 SlexKit，上面的代码块会显示为普通代码块，用户可以看到原始的 DSL 定义。这就是"Markdown 原生"的意义——降级优雅，不影响阅读。
