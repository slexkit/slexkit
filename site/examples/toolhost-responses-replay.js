function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function textEvent(role, text) {
  return {
    type: "message/output_text",
    role,
    text,
  };
}

function dynamicTextEvent(role, kind, locale) {
  return {
    type: "message/output_text.dynamic",
    role,
    kind,
    locale,
  };
}

function functionCallEvents({ itemId, callId, name, arguments: args }) {
  const json = JSON.stringify(args);
  const splitAt = Math.max(1, Math.floor(json.length * 0.58));
  return [
    {
      type: "response.output_item.added",
      item: {
        id: itemId,
        type: "function_call",
        call_id: callId,
        name,
        status: "in_progress",
      },
    },
    {
      type: "response.function_call_arguments.delta",
      item_id: itemId,
      delta: json.slice(0, splitAt),
    },
    {
      type: "response.function_call_arguments.delta",
      item_id: itemId,
      delta: json.slice(splitAt),
    },
    {
      type: "response.function_call_arguments.done",
      item_id: itemId,
      arguments: json,
    },
    {
      type: "response.output_item.done",
      item: {
        id: itemId,
        type: "function_call",
        call_id: callId,
        name,
        status: "completed",
        arguments: json,
      },
    },
  ];
}

function parseArguments(source) {
  if (!source) return {};
  try {
    const value = JSON.parse(source);
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function outputFor(state, callId) {
  return state.transcript.find((item) => item.kind === "tool-output" && item.callId === callId)?.output ?? null;
}

const strategyLabels = {
  "zh-CN": {
    canary: "10% 灰度发布",
    full: "全量发布",
    hold: "暂缓发布",
  },
  "en-US": {
    canary: "10% canary release",
    full: "full release",
    hold: "hold release",
  },
};

function selectedStrategy(state, locale) {
  const selected = outputFor(state, "call_release_parameters")?.selected?.[0];
  return strategyLabels[locale]?.[selected] ?? strategyLabels[locale]?.canary ?? "";
}

function releaseConstraints(state, locale) {
  const fallback = locale === "zh-CN"
    ? {
        window: "今晚 22:00 - 23:00",
        owner: "值班 SRE / Web 平台负责人",
        rollback: "错误率超过 1% 或 P95 延迟连续 5 分钟高于 800ms",
      }
    : {
        window: "Tonight 22:00 - 23:00",
        owner: "on-call SRE / Web platform lead",
        rollback: "error rate exceeds 1% or P95 latency stays above 800ms",
      };
  return { ...fallback, ...(outputFor(state, "call_release_parameters") ?? {}) };
}

function renderDynamicText(state, event) {
  const locale = event.locale ?? "en-US";
  const strategy = selectedStrategy(state, locale);
  const constraints = releaseConstraints(state, locale);

  if (locale === "zh-CN") {
    if (event.kind === "plan_followup") {
      return `这张工具卡片已经写回 function_call_output：strategy=${strategy}，window=${constraints.window}，owner=${constraints.owner}。结果记录会留在对话轨迹里，宿主继续等待确认。`;
    }
    if (event.kind === "final_summary") {
      return "确认结果也写回了 function_call_output。对话里会保留两条结果记录；页面没有连接模型或后端。";
    }
  }

  if (event.kind === "plan_followup") {
    return `This tool card wrote back function_call_output: strategy=${strategy}, window=${constraints.window}, owner=${constraints.owner}. The receipt stays in the trace while the host waits for confirmation.`;
  }
  if (event.kind === "final_summary") {
    return "The confirmation also wrote back function_call_output. The conversation keeps both receipts; this page does not call a model or backend.";
  }

  return "";
}

const zhCNScenario = {
  title: "ToolHost 工具调用 UI",
  subtitle: "function_call -> ToolHost 工具卡片 -> function_call_output + 结果记录。",
  restartLabel: "重新演示",
  pendingLabel: "待确认",
  completedLabel: "已写回",
  ignoredLabel: "已忽略",
  transcriptLabel: "工具轨迹",
  protocolLabel: "协议事件",
  referenceLabel: "ToolHost 接入片段",
  referenceEyebrow: "宿主接入",
  referenceTitle: "接入位置",
  referenceDescription: "展开查看宿主如何把一次 function_call 接到 renderToolCall()，再写回 function_call_output。",
  eventDetailsLabel: "事件明细",
  generatedLabel: "生成",
  userLabel: "用户",
  assistantLabel: "Agent",
  toolLabel: "ToolHost 卡片",
  toolResultLabel: "结果记录",
  toolCallLabel: "function call",
  toolOutputLabel: "function_call_output",
  argumentsLabel: "function_call arguments",
  rawOutputLabel: "Raw JSON",
  eyebrow: "ToolHost",
  decisionLabel: "ToolHost 工具状态",
  awaitingDecisionLabel: "等待工具结果",
  directionLabel: "策略参数",
  constraintsLabel: "工具参数",
  approvalLabel: "确认写回",
  releaseParametersLabel: "工具结果",
  releaseParametersSubmittedLabel: "工具结果已写回",
  approvalResultLabel: "确认结果",
  approvalSubmittedLabel: "确认已写回",
  currentPhaseLabel: "当前状态",
  functionCallReceivedLabel: "收到请求",
  toolHostCardLabel: "工具卡片",
  outputReturnedLabel: "写回输出",
  toolOutputsLabel: "写回输出",
  pendingCallLabel: "待处理调用",
  notSetLabel: "未提交",
  approvedLabel: "已确认",
  phaseToolInputLabel: "等待工具结果",
  phaseDoneLabel: "完成",
  phaseRunningLabel: "读取事件",
  protocolSummaries: {
    messageOutput: "消息输出",
    functionCallAdded: "收到 function_call",
    argumentsDelta: "正在流式接收 arguments 片段",
    argumentsDone: "arguments 已组装",
    outputItemDone: "function_call 完成，准备渲染 ToolHost 卡片",
    slexExpression: "ToolHost 已编译为 Slex 组件",
    functionCallOutput: "工具结果已写回为 function_call_output",
  },
  rawJsonLabel: "Raw JSON",
  expectedToolOutputs: 2,
  directions: {
    canary: "10% 灰度发布",
    full: "全量发布",
    hold: "暂缓发布",
  },
  events: [
    textEvent("user", "需要一次工具调用 UI：展示发布窗口、负责人和回滚条件，写回结构化结果；不执行发布。"),
    textEvent("assistant", "我会渲染 ToolHost 工具卡片。提交后，宿主按原 call_id 写回 function_call_output，并保留结果记录。"),
    ...functionCallEvents({
      itemId: "fc_release_parameters",
      callId: "call_release_parameters",
      name: "release-parameters",
      arguments: {
        title: "发布参数工具卡片",
        description: "这些字段会作为工具结果写回给宿主，并保留在对话轨迹里。",
        submitLabel: "提交工具结果",
        ignoreLabel: "忽略请求",
        options: [
          { id: "canary", label: "10% 灰度发布", description: "先开放少量流量，观察核心指标后再扩大范围" },
          { id: "full", label: "全量发布", description: "一次性切换全部流量，适合低风险补丁" },
          { id: "hold", label: "暂缓发布", description: "保留计划但不进入发布窗口" },
        ],
        values: {
          window: "今晚 22:00 - 23:00",
          owner: "值班 SRE / Web 平台负责人",
          rollback: "错误率超过 1% 或 P95 延迟连续 5 分钟高于 800ms",
        },
      },
    }),
    dynamicTextEvent("assistant", "plan_followup", "zh-CN"),
    ...functionCallEvents({
      itemId: "fc_approval",
      callId: "call_approval",
      name: "confirm-action",
      arguments: {
        title: "确认写回结果",
        description: "确认后再写回一条 function_call_output；不会触发真实部署。",
        confirmLabel: "确认并写回",
        ignoreLabel: "跳过确认",
      },
    }),
    dynamicTextEvent("assistant", "final_summary", "zh-CN"),
  ],
};

const enUSScenario = {
  title: "ToolHost Tool Call UI",
  subtitle: "function_call -> ToolHost card -> function_call_output + receipt.",
  restartLabel: "Restart demo",
  pendingLabel: "Pending",
  completedLabel: "Written back",
  ignoredLabel: "Ignored",
  transcriptLabel: "Tool trace",
  protocolLabel: "Protocol events",
  referenceLabel: "ToolHost integration snippet",
  referenceEyebrow: "Host integration",
  referenceTitle: "Where it connects",
  referenceDescription: "Expand to see how the host maps one function_call into renderToolCall(), then writes function_call_output back.",
  eventDetailsLabel: "Event details",
  generatedLabel: "Generated",
  userLabel: "User",
  assistantLabel: "Agent",
  toolLabel: "ToolHost card",
  toolResultLabel: "Receipt",
  toolCallLabel: "function call",
  toolOutputLabel: "function_call_output",
  argumentsLabel: "function_call arguments",
  rawOutputLabel: "Raw JSON",
  eyebrow: "ToolHost",
  decisionLabel: "ToolHost tool status",
  awaitingDecisionLabel: "Waiting for tool result",
  directionLabel: "Strategy argument",
  constraintsLabel: "Tool arguments",
  approvalLabel: "Confirmation write-back",
  releaseParametersLabel: "Tool result",
  releaseParametersSubmittedLabel: "Tool result written back",
  approvalResultLabel: "Confirmation result",
  approvalSubmittedLabel: "Confirmation written back",
  currentPhaseLabel: "Status",
  functionCallReceivedLabel: "Request",
  toolHostCardLabel: "Tool card",
  outputReturnedLabel: "Written output",
  toolOutputsLabel: "Written outputs",
  pendingCallLabel: "Pending call",
  notSetLabel: "Not submitted",
  approvedLabel: "Confirmed",
  phaseToolInputLabel: "Waiting for tool result",
  phaseDoneLabel: "Complete",
  phaseRunningLabel: "Reading events",
  protocolSummaries: {
    messageOutput: "Message output",
    functionCallAdded: "function_call received",
    argumentsDelta: "Streaming arguments fragment",
    argumentsDone: "arguments assembled",
    outputItemDone: "function_call complete; ToolHost card will render",
    slexExpression: "ToolHost compiled the call into Slex components",
    functionCallOutput: "Tool result written back as function_call_output",
  },
  rawJsonLabel: "Raw JSON",
  expectedToolOutputs: 2,
  directions: {
    canary: "10% canary release",
    full: "Full release",
    hold: "Hold release",
  },
  events: [
    textEvent("user", "Need one tool-call UI: show release window, owner, and rollback criteria, then write back structured data; do not execute a deployment."),
    textEvent("assistant", "I will render a ToolHost tool card. After submission, the host writes function_call_output with the original call_id and keeps a visible receipt."),
    ...functionCallEvents({
      itemId: "fc_release_parameters",
      callId: "call_release_parameters",
      name: "release-parameters",
      arguments: {
        title: "Release parameters tool card",
        description: "These fields write back as a tool result and remain visible in the conversation trace.",
        submitLabel: "Submit tool result",
        ignoreLabel: "Ignore request",
        options: [
          { id: "canary", label: "10% canary release", description: "Open a small amount of traffic first, then expand after checks pass" },
          { id: "full", label: "Full release", description: "Switch all traffic at once, suitable for low-risk patches" },
          { id: "hold", label: "Hold release", description: "Keep the plan but do not enter a release window" },
        ],
        values: {
          window: "Tonight 22:00 - 23:00",
          owner: "On-call SRE / Web platform lead",
          rollback: "Error rate above 1% or P95 latency above 800ms for 5 minutes",
        },
      },
    }),
    dynamicTextEvent("assistant", "plan_followup", "en-US"),
    ...functionCallEvents({
      itemId: "fc_approval",
      callId: "call_approval",
      name: "confirm-action",
      arguments: {
        title: "Confirm write-back",
        description: "Confirming writes the confirmation function_call_output. It does not run a deployment.",
        confirmLabel: "Confirm and write back",
        ignoreLabel: "Skip confirmation",
      },
    }),
    dynamicTextEvent("assistant", "final_summary", "en-US"),
  ],
};

export const toolHostResponsesScenarios = {
  "zh-CN": zhCNScenario,
  "en-US": enUSScenario,
};

export function createToolHostReplay(events) {
  return {
    events: clone(events),
    index: 0,
    transcript: [],
    protocolItems: [],
    pendingToolCall: null,
    drafts: new Map(),
    status: "idle",
  };
}

export function replayUntilPause(state) {
  state.status = "running";

  while (state.index < state.events.length) {
    const event = state.events[state.index];
    state.index += 1;

    if (event.type === "message/output_text" || event.type === "message/output_text.dynamic") {
      const text = event.type === "message/output_text.dynamic" ? renderDynamicText(state, event) : event.text;
      const id = `message_${state.transcript.length}`;
      state.transcript.push({
        id,
        kind: "message",
        role: event.role,
        text,
      });
      state.protocolItems.push({
        id,
        type: "message/output_text",
        label: event.role,
        body: text,
        raw: {
          type: "message",
          role: event.role,
          content: [{ type: "output_text", text }],
        },
      });
      continue;
    }

    if (event.type === "response.output_item.added" && event.item?.type === "function_call") {
      state.drafts.set(event.item.id, {
        id: event.item.id,
        callId: event.item.call_id,
        name: event.item.name,
        argsText: "",
      });
      state.protocolItems.push({
        id: `${event.item.id}_added`,
        type: event.type,
        label: event.item.name,
        body: { call_id: event.item.call_id, name: event.item.name },
        raw: {
          type: event.type,
          item: event.item,
        },
      });
      continue;
    }

    if (event.type === "response.function_call_arguments.delta") {
      const draft = state.drafts.get(event.item_id);
      if (draft) draft.argsText += event.delta ?? "";
      state.protocolItems.push({
        id: `${event.item_id}_delta_${state.protocolItems.length}`,
        type: event.type,
        label: event.item_id,
        body: event.delta ?? "",
        raw: {
          type: event.type,
          item_id: event.item_id,
          delta: event.delta ?? "",
        },
      });
      continue;
    }

    if (event.type === "response.function_call_arguments.done") {
      const draft = state.drafts.get(event.item_id);
      if (draft) draft.argsText = event.arguments ?? draft.argsText;
      state.protocolItems.push({
        id: `${event.item_id}_arguments_done`,
        type: event.type,
        label: event.item_id,
        body: parseArguments(event.arguments),
        raw: {
          type: event.type,
          item_id: event.item_id,
          arguments: event.arguments ?? "",
        },
      });
      continue;
    }

    if (event.type === "response.output_item.done" && event.item?.type === "function_call") {
      const draft = state.drafts.get(event.item.id) ?? {
        id: event.item.id,
        callId: event.item.call_id,
        name: event.item.name,
        argsText: event.item.arguments ?? "",
      };
      const argsText = event.item.arguments ?? draft.argsText;
      const args = parseArguments(argsText);
      const call = {
        id: draft.callId,
        name: draft.name,
        arguments: args,
      };
      state.protocolItems.push({
        id: `${event.item.id}_done`,
        type: event.type,
        label: event.item.name,
        body: { call_id: draft.callId, name: draft.name, arguments: args },
        raw: {
          type: event.type,
          item: {
            ...event.item,
            arguments: argsText,
          },
        },
      });
      state.pendingToolCall = call;
      state.status = "paused";
      state.transcript.push({
        id: `tool_call_${call.id ?? event.item.id}_${state.transcript.length}`,
        kind: "tool-call",
        callId: call.id,
        name: call.name,
        arguments: call.arguments,
        status: "pending",
      });
      return state;
    }
  }

  state.status = "done";
  state.pendingToolCall = null;
  return state;
}

export function submitToolResult(state, result) {
  if (!state.pendingToolCall) {
    throw new Error("Cannot submit a ToolResult without a pending tool call.");
  }

  const call = state.pendingToolCall;
  const status = result.status === "ignored" ? "ignored" : "submitted";
  const output = status === "submitted" ? (result.value ?? {}) : { ignored: true };

  for (const item of state.transcript) {
    if (item.kind === "tool-call" && item.callId === call.id) {
      item.status = status;
    }
  }

  state.transcript.push({
    id: `tool_output_${call.id}_${state.transcript.length}`,
    kind: "tool-output",
    callId: call.id,
    toolName: call.name,
    status,
    output,
  });

  state.protocolItems.push({
    id: `function_call_output_${call.id}`,
    type: "function_call_output",
    label: call.id,
    body: {
      type: "function_call_output",
      call_id: call.id,
      output: JSON.stringify(output),
    },
    raw: {
      type: "function_call_output",
      call_id: call.id,
      output: JSON.stringify(output),
    },
    generated: true,
  });

  state.pendingToolCall = null;
  return replayUntilPause(state);
}
