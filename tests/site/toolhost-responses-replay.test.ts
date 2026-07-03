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
    const fixture = toolHostResponsesFixtures["en-US"];

    replayUntilPause(replay);

    expect(fixture.eyebrow).toBe("Agent trace");
    expect(fixture.toolLabel).toBe("Needs your confirmation");
    expect(fixture.toolResultLabel).toBe("Returned to agent");
    expect(replay.status).toBe("paused");
    expect(replay.pendingToolCall).toMatchObject({
      id: "call_release_parameters",
      name: "release-parameters",
    });
    expect(replay.pendingToolCall?.arguments?.title).toBe("Complete release parameters");
    expect(replay.transcript.filter((item) => item.kind === "message").map((item) => item.text).join("\n")).not.toMatch(/tool output|function_call/);
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
    const replay = createToolHostReplay(toolHostResponsesFixtures["en-US"].events);

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
    expect(replay.transcript.some((item) => item.kind === "message" && item.text.includes("full release"))).toBe(true);
  });

  it("can complete all ToolHost calls without a backend", () => {
    const replay = createToolHostReplay(toolHostResponsesFixtures["zh-CN"].events);

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
  });
});
