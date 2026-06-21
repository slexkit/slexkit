import { describe, expect, it } from "bun:test";
import {
  createToolHostReplay,
  replayUntilPause,
  submitToolResult,
  toolHostResponsesFixtures,
} from "../../site/examples/toolhost-responses-replay.js";

describe("ToolHost Responses replay", () => {
  it("pauses when a function_call output item completes", () => {
    const replay = createToolHostReplay(toolHostResponsesFixtures["en-US"].events);

    replayUntilPause(replay);

    expect(replay.status).toBe("paused");
    expect(replay.pendingToolCall).toMatchObject({
      id: "call_direction",
      name: "choose-options",
    });
    expect(replay.pendingToolCall?.arguments?.title).toBe("Choose the release strategy");
    expect(replay.transcript.map((item) => item.kind)).toEqual(["message", "message", "tool-call"]);
    expect(replay.protocolItems.some((item) => item.type === "response.function_call_arguments.delta")).toBe(true);
  });

  it("appends function_call_output and resumes to the next tool call", () => {
    const replay = createToolHostReplay(toolHostResponsesFixtures["en-US"].events);

    replayUntilPause(replay);
    submitToolResult(replay, {
      toolCallId: "call_direction",
      toolName: "choose-options",
      status: "submitted",
      value: { selected: ["canary"] },
    });

    expect(replay.status).toBe("paused");
    expect(replay.pendingToolCall).toMatchObject({
      id: "call_constraints",
      name: "fill-form",
    });
    expect(replay.pendingToolCall?.arguments?.title).toBe("Add release constraints");
    expect(replay.transcript.some((item) => item.kind === "tool-output" && item.callId === "call_direction")).toBe(true);
    expect(replay.protocolItems.at(-1)).toMatchObject({
      type: "response.output_item.done",
      label: "fill-form",
    });
    expect(replay.protocolItems.some((item) => item.type === "function_call_output" && item.label === "call_direction")).toBe(true);
  });

  it("can complete all fixture tool calls without a backend", () => {
    const replay = createToolHostReplay(toolHostResponsesFixtures["zh-CN"].events);

    replayUntilPause(replay);
    submitToolResult(replay, {
      toolCallId: "call_direction",
      toolName: "choose-options",
      status: "submitted",
      value: { selected: ["canary"] },
    });
    submitToolResult(replay, {
      toolCallId: "call_constraints",
      toolName: "fill-form",
      status: "submitted",
      value: {
        window: "今晚 22:00 - 23:00",
        owner: "值班 SRE",
        rollback: "错误率超过 1%",
      },
    });
    expect(replay.pendingToolCall).toMatchObject({
      id: "call_confirm",
      name: "confirm-action",
    });
    expect(replay.pendingToolCall?.arguments?.title).toBe("确认采用发布计划");
    submitToolResult(replay, {
      toolCallId: "call_confirm",
      toolName: "confirm-action",
      status: "submitted",
      value: { confirmed: true },
    });

    expect(replay.status).toBe("done");
    expect(replay.pendingToolCall).toBeNull();
    expect(replay.transcript.filter((item) => item.kind === "tool-output")).toHaveLength(3);
    expect(replay.transcript.at(-1)).toMatchObject({
      kind: "message",
      role: "assistant",
    });
  });
});
