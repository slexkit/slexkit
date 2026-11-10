import { afterEach, describe, expect, it } from "bun:test";
import { leaveAnimationOptions, runCssAnimation } from "../../src/engine/animation";
import { mockAnimationStyle } from "./animation-test-utils";

let restore: (() => void) | undefined;
afterEach(() => { restore?.(); restore = undefined; document.body.replaceChildren(); });

describe("animation lifecycle utility", () => {
  it("finishes immediately when no active animation exists", () => {
    const node = document.createElement("div"); document.body.append(node);
    let finishes = 0;
    runCssAnimation(node, "missing", () => finishes++, leaveAnimationOptions);
    expect(finishes).toBe(1);
  });

  it("ignores child events and finishes once on owner end or cancel", () => {
    restore = mockAnimationStyle("leave");
    const node = document.createElement("div"); const child = document.createElement("span");
    node.append(child); document.body.append(node); let finishes = 0;
    runCssAnimation(node, "leave", () => finishes++, leaveAnimationOptions);
    child.dispatchEvent(new Event("animationend", { bubbles: true }));
    expect(finishes).toBe(0);
    node.dispatchEvent(new Event("animationcancel"));
    node.dispatchEvent(new Event("animationend"));
    expect(finishes).toBe(1);
  });

  it("uses duration, delay and iteration lists for its watchdog", () => {
    restore = mockAnimationStyle("timed", {
      animationName: "short, long", animationDuration: "10ms, 20ms",
      animationDelay: "5ms, 10ms", animationIterationCount: "2, 3",
    });
    const node = document.createElement("div"); document.body.append(node);
    const view = document.defaultView!; const original = view.setTimeout; let delay: number | undefined;
    Object.defineProperty(view, "setTimeout", { configurable: true, value: ((_fn: () => void, ms?: number) => { delay = ms; return 1; }) });
    try { runCssAnimation(node, "timed", () => {}, leaveAnimationOptions); expect(delay).toBe(120); }
    finally { Object.defineProperty(view, "setTimeout", { configurable: true, value: original }); }
  });

  it("cleanup interrupts an infinite animation exactly once", () => {
    restore = mockAnimationStyle("infinite", { animationIterationCount: "infinite" });
    const node = document.createElement("div"); document.body.append(node); let finishes = 0;
    const cleanup = runCssAnimation(node, "infinite", () => finishes++, leaveAnimationOptions);
    cleanup(); cleanup();
    expect(finishes).toBe(1);
  });
});
