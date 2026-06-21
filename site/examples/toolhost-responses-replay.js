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

const zhCNFixture = {
  title: "发布计划确认",
  subtitle: "AI 生成发布计划时在关键节点暂停，由 ToolHost 收集用户决定，再继续输出摘要。",
  restartLabel: "重新播放",
  pendingLabel: "等待用户输入",
  completedLabel: "已返回",
  ignoredLabel: "已忽略",
  transcriptLabel: "对话与工具调用",
  protocolLabel: "Responses 事件",
  generatedLabel: "生成",
  userLabel: "你",
  assistantLabel: "AI",
  toolLabel: "ToolHost",
  eyebrow: "ToolHost · Responses 回放",
  decisionLabel: "当前决策",
  awaitingDecisionLabel: "等待用户选择",
  directionLabel: "发布策略",
  constraintsLabel: "发布窗口",
  approvalLabel: "确认状态",
  notSetLabel: "未提交",
  approvedLabel: "已确认采用",
  directions: {
    canary: "10% 灰度发布",
    full: "全量发布",
    hold: "暂缓发布",
  },
  events: [
    textEvent("user", "帮我准备一次 Web 控制台发布计划。目标是低风险上线，必须可回滚，先不要真的执行。"),
    textEvent("assistant", "我会先整理发布方案。发布策略会影响窗口、监控和回滚条件，需要你先确认采用哪一种方式。"),
    ...functionCallEvents({
      itemId: "fc_direction",
      callId: "call_direction",
      name: "choose-options",
      arguments: {
        title: "选择发布策略",
        description: "这个选择只用于生成发布计划，不会触发真实部署。",
        submitLabel: "采用策略",
        ignoreLabel: "跳过",
        multiple: false,
        minSelected: 1,
        maxSelected: 1,
        options: [
          { id: "canary", label: "10% 灰度发布", description: "先开放少量流量，观察核心指标后再扩大范围" },
          { id: "full", label: "全量发布", description: "一次性切换全部流量，适合低风险补丁" },
          { id: "hold", label: "暂缓发布", description: "保留计划但不进入发布窗口" },
        ],
      },
    }),
    textEvent("assistant", "我会按 10% 灰度发布准备计划。还需要补充发布窗口、负责人和回滚条件，便于生成可审阅的发布摘要。"),
    ...functionCallEvents({
      itemId: "fc_constraints",
      callId: "call_constraints",
      name: "fill-form",
      arguments: {
        title: "补充发布约束",
        description: "这些字段会作为结构化结果返回给宿主，用于继续生成发布计划。",
        submitLabel: "提交约束",
        ignoreLabel: "取消",
        fields: [
          { name: "window", label: "发布窗口", type: "text", value: "今晚 22:00 - 23:00", required: true },
          { name: "owner", label: "负责人", type: "text", value: "值班 SRE / Web 平台负责人", required: true },
          { name: "rollback", label: "回滚条件", type: "text", value: "错误率超过 1% 或 P95 延迟连续 5 分钟高于 800ms", required: true },
        ],
      },
    }),
    textEvent("assistant", "约束已收到。我会把发布计划整理为可审阅版本：包含灰度范围、观察指标、负责人和回滚条件。最后需要你确认是否采用这份计划。"),
    ...functionCallEvents({
      itemId: "fc_confirm",
      callId: "call_confirm",
      name: "confirm-action",
      arguments: {
        title: "确认采用发布计划",
        description: "确认后，结果会作为 function_call_output 回填；这只表示采用计划，不会执行真实发布。",
        confirmLabel: "采用计划",
        ignoreLabel: "暂不采用",
      },
    }),
    textEvent("assistant", "发布计划已确认：今晚 22:00 开始 10% 灰度发布，由值班 SRE 和 Web 平台负责人看护；若错误率超过 1% 或 P95 延迟持续异常，则立即回滚。这个演示仍然是静态回放，没有连接真实发布系统。"),
  ],
};

const enUSFixture = {
  title: "Release Plan Approval",
  subtitle: "The replay pauses at key release decisions, collects user input through ToolHost, then continues.",
  restartLabel: "Replay",
  pendingLabel: "Waiting for input",
  completedLabel: "Returned",
  ignoredLabel: "Ignored",
  transcriptLabel: "Conversation and tool calls",
  protocolLabel: "Responses items",
  generatedLabel: "Generated",
  userLabel: "You",
  assistantLabel: "AI",
  toolLabel: "ToolHost",
  eyebrow: "ToolHost · Responses replay",
  decisionLabel: "Current decision",
  awaitingDecisionLabel: "Waiting for user choice",
  directionLabel: "Release strategy",
  constraintsLabel: "Release window",
  approvalLabel: "Approval state",
  notSetLabel: "Not submitted",
  approvedLabel: "Plan approved",
  directions: {
    canary: "10% canary release",
    full: "Full release",
    hold: "Hold release",
  },
  events: [
    textEvent("user", "Prepare a release plan for the web console. Keep it low risk, make it rollbackable, and do not execute anything yet."),
    textEvent("assistant", "I will draft the release plan. The strategy changes the window, monitoring, and rollback criteria, so I need you to choose how to proceed first."),
    ...functionCallEvents({
      itemId: "fc_direction",
      callId: "call_direction",
      name: "choose-options",
      arguments: {
        title: "Choose the release strategy",
        description: "This choice is only used to generate the release plan. It does not trigger deployment.",
        submitLabel: "Use strategy",
        ignoreLabel: "Skip",
        multiple: false,
        minSelected: 1,
        maxSelected: 1,
        options: [
          { id: "canary", label: "10% canary release", description: "Open a small amount of traffic first, then expand after checks pass" },
          { id: "full", label: "Full release", description: "Switch all traffic at once, suitable for low-risk patches" },
          { id: "hold", label: "Hold release", description: "Keep the plan but do not enter a release window" },
        ],
      },
    }),
    textEvent("assistant", "I will prepare a 10% canary plan. I still need the release window, owner, and rollback criteria so the summary is reviewable."),
    ...functionCallEvents({
      itemId: "fc_constraints",
      callId: "call_constraints",
      name: "fill-form",
      arguments: {
        title: "Add release constraints",
        description: "ToolHost returns these fields as structured data so the host can continue the release plan.",
        submitLabel: "Submit constraints",
        ignoreLabel: "Cancel",
        fields: [
          { name: "window", label: "Release window", type: "text", value: "Tonight 22:00 - 23:00", required: true },
          { name: "owner", label: "Owner", type: "text", value: "On-call SRE / Web platform lead", required: true },
          { name: "rollback", label: "Rollback criteria", type: "text", value: "Error rate above 1% or P95 latency above 800ms for 5 minutes", required: true },
        ],
      },
    }),
    textEvent("assistant", "Constraints received. I will turn this into a reviewable plan with canary scope, monitoring checks, owners, and rollback criteria. Please confirm whether to adopt it."),
    ...functionCallEvents({
      itemId: "fc_confirm",
      callId: "call_confirm",
      name: "confirm-action",
      arguments: {
        title: "Approve this release plan",
        description: "After confirmation, the result is appended as function_call_output. This approves the plan only; it does not execute a deployment.",
        confirmLabel: "Approve plan",
        ignoreLabel: "Do not approve",
      },
    }),
    textEvent("assistant", "Release plan approved: start a 10% canary tonight at 22:00, watched by the on-call SRE and Web platform lead. Roll back immediately if error rate exceeds 1% or P95 latency stays above 800ms. This demo remains a static replay and is not connected to a real deployment system."),
  ],
};

export const toolHostResponsesFixtures = {
  "zh-CN": zhCNFixture,
  "en-US": enUSFixture,
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

    if (event.type === "message/output_text") {
      const id = `message_${state.transcript.length}`;
      state.transcript.push({
        id,
        kind: "message",
        role: event.role,
        text: event.text,
      });
      state.protocolItems.push({
        id,
        type: event.type,
        label: event.role,
        body: event.text,
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
      state.pendingToolCall = call;
      state.status = "paused";
      state.transcript.push({
        id: `tool_call_${draft.callId}`,
        kind: "tool-call",
        callId: draft.callId,
        name: draft.name,
        arguments: args,
        status: "pending",
      });
      state.protocolItems.push({
        id: `${event.item.id}_done`,
        type: event.type,
        label: event.item.name,
        body: { call_id: draft.callId, name: draft.name, arguments: args },
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

  const callId = result.toolCallId ?? state.pendingToolCall.id;
  const status = result.status === "ignored" ? "ignored" : "submitted";
  const output = status === "submitted" ? (result.value ?? {}) : { ignored: true };

  for (const item of state.transcript) {
    if (item.kind === "tool-call" && item.callId === callId) {
      item.status = status;
    }
  }

  state.transcript.push({
    id: `tool_output_${callId}`,
    kind: "tool-output",
    callId,
    status,
    output,
  });
  state.protocolItems.push({
    id: `function_call_output_${callId}`,
    type: "function_call_output",
    label: callId,
    body: {
      type: "function_call_output",
      call_id: callId,
      output: JSON.stringify(output),
    },
    generated: true,
  });
  state.pendingToolCall = null;
  return replayUntilPause(state);
}
