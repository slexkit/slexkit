import { describe, expect, it } from "bun:test";
import {
  createToolHostReplay,
  replayUntilPause,
  submitToolResult,
  toolHostResponsesScenarios,
} from "../../site/examples/toolhost-responses-replay.js";

describe("ToolHost Responses replay", () => {
  it("pauses when a function_call output item completes", () => {
    const replay = createToolHostReplay(toolHostResponsesScenarios["en-US"].events);
    const scenario = toolHostResponsesScenarios["en-US"];

    replayUntilPause(replay);

    expect(scenario.eyebrow).toBe("ToolHost");
    expect(scenario.title).toBe("ToolHost Tool Call UI");
    expect(scenario.eventDetailsLabel).toBe("Event details");
    expect(scenario.expectedToolOutputs).toBe(2);
    expect(scenario.functionCallReceivedLabel).toBe("Request");
    expect(scenario.toolHostCardLabel).toBe("Tool card");
    expect(scenario.outputReturnedLabel).toBe("Written output");
    expect(scenario.toolLabel).toBe("ToolHost card");
    expect(scenario.toolResultLabel).toBe("Receipt");
    expect(replay.status).toBe("paused");
    expect(replay.pendingToolCall).toMatchObject({
      id: "call_release_parameters",
      name: "release-parameters",
    });
    expect(replay.pendingToolCall?.arguments?.title).toBe("Release parameters tool card");
    expect(replay.transcript.filter((item) => item.kind === "message").map((item) => item.text).join("\n")).toContain("ToolHost tool card");
    expect(replay.transcript.map((item) => item.kind)).toEqual(["message", "message", "tool-call"]);
    expect(replay.protocolItems[0].raw).toMatchObject({
      type: "message",
      role: "user",
      content: [{ type: "output_text" }],
    });
    expect(replay.protocolItems.find((item) => item.type === "response.function_call_arguments.delta")?.raw).toMatchObject({
      type: "response.function_call_arguments.delta",
      item_id: "fc_release_parameters",
    });
  });

  it("submits release parameters and resumes to approval", () => {
    const replay = createToolHostReplay(toolHostResponsesScenarios["en-US"].events);

    replayUntilPause(replay);
    submitToolResult(replay, {
      toolCallId: "call_release_parameters",
      toolName: "release-parameters",
      status: "submitted",
      value: {
        selected: ["full"],
        window: "Tonight 22:00 - 23:00",
        owner: "On-call SRE",
        rollback: "Error rate above 1%",
      },
    });

    expect(replay.status).toBe("paused");
    expect(replay.pendingToolCall).toMatchObject({
      id: "call_approval",
      name: "confirm-action",
    });
    expect(replay.transcript.some((item) => item.kind === "tool-output" && item.callId === "call_release_parameters")).toBe(true);
    expect(replay.protocolItems.some((item) => item.type === "function_call_output" && item.label === "call_release_parameters")).toBe(true);
    expect(replay.protocolItems.find((item) => item.label === "call_release_parameters" && item.type === "function_call_output")?.raw).toMatchObject({
      type: "function_call_output",
      call_id: "call_release_parameters",
    });
    expect(replay.transcript.some((item) => item.kind === "message" && item.text.includes("function_call_output"))).toBe(true);
    expect(replay.transcript.some((item) => item.kind === "message" && item.text.includes("wrote back function_call_output"))).toBe(true);
    expect(replay.transcript.some((item) => item.kind === "message" && item.text.includes("full release"))).toBe(true);
  });

  it("can complete all ToolHost calls without a backend", () => {
    const replay = createToolHostReplay(toolHostResponsesScenarios["zh-CN"].events);

    replayUntilPause(replay);
    submitToolResult(replay, {
      toolCallId: "call_release_parameters",
      toolName: "release-parameters",
      status: "submitted",
      value: {
        selected: ["canary"],
        window: "今晚 22:00 - 23:00",
        owner: "值班 SRE",
        rollback: "错误率超过 1%",
      },
    });
    expect(replay.pendingToolCall).toMatchObject({
      id: "call_approval",
      name: "confirm-action",
    });

    submitToolResult(replay, {
      toolCallId: "call_approval",
      toolName: "confirm-action",
      status: "submitted",
      value: { confirmed: true },
    });

    expect(replay.status).toBe("done");
    expect(replay.pendingToolCall).toBeNull();
    expect(replay.transcript.filter((item) => item.kind === "tool-output")).toHaveLength(2);
    expect(replay.protocolItems.filter((item) => item.type === "function_call_output")).toHaveLength(2);
    expect(replay.transcript.at(-1)).toMatchObject({
      kind: "message",
      role: "assistant",
    });
    expect(replay.transcript.at(-1)?.text).toContain("function_call_output");
    expect(replay.transcript.at(-1)?.text).toContain("写回了");
  });

  it("documents ToolHost as tool-call UI instead of a release approval app", async () => {
    const zh = await Bun.file("site/content/examples/toolhost-demo/zh-CN.md").text();
    const en = await Bun.file("site/content/examples/toolhost-demo/en-US.md").text();

    expect(zh).toContain('title: "ToolHost 工具调用 UI"');
    expect(zh).toContain("`function_call` 时，浏览器宿主可以把它渲染成对话里的 ToolHost 工具卡片");
    expect(zh).toContain("function_call_output");
    expect(zh).toContain("写回");
    expect(zh).not.toContain("发布确认");
    expect(zh).not.toContain("人工输入回路");
    expect(zh).not.toContain("人工补齐");
    expect(zh).not.toContain("样例 payload");
    expect(zh).not.toContain("fixture");

    expect(en).toContain('title: "ToolHost Tool Call UI"');
    expect(en).toContain("render it as an inline ToolHost card");
    expect(en).toContain("function_call_output");
    expect(en).toContain("writes");
    expect(en).not.toContain("Release Approval");
    expect(en).not.toContain("sample payload");
    expect(en).not.toContain("client-side fixture");
  });
});
