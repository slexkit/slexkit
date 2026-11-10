import { afterEach, describe, expect, it } from "bun:test";
import { enterAnimationOptions, runCssAnimation } from "../../src/engine/animation";
import { mockAnimationStyle } from "./animation-test-utils";

let restore: (() => void) | undefined;
afterEach(() => { restore?.(); restore = undefined; });

describe("enter animation utility", () => {
  it("adds the requested class and removes it on completion", () => {
    restore = mockAnimationStyle("slex-fade-in");
    const node = document.createElement("div"); document.body.replaceChildren(node);
    runCssAnimation(node, "slex-fade-in", () => {}, enterAnimationOptions);
    expect(node.classList.contains("slex-fade-in")).toBe(true);
    node.dispatchEvent(new Event("animationend"));
    expect(node.classList.contains("slex-fade-in")).toBe(false);
  });

  it("takes a native JavaScript class value rather than an expression string", () => {
    restore = mockAnimationStyle("slex-slide-in");
    const selected = "slex-slide-in";
    const node = document.createElement("div"); document.body.replaceChildren(node);
    runCssAnimation(node, selected, () => {}, enterAnimationOptions);
    expect(node.classList.contains(selected)).toBe(true);
  });
});
