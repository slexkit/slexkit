import { describe, it, expect } from "bun:test";
import { mount } from "../../src/engine/index";
import "../../src/components/index";
import { chooseBalancedColumns, createBalancedTileLayout } from "../../src/components/svelte/layout/balancedTiles";

function sleep(ms = 30) {
  return new Promise((r) => setTimeout(r, ms));
}

function mockVibrate() {
  const calls: Array<number | number[]> = [];
  Object.defineProperty(navigator, "vibrate", {
    value: (pattern: number | number[]) => {
      calls.push(pattern);
      return true;
    },
    configurable: true,
  });
  return calls;
}

function unique(ns = "v014") {
  return `${ns}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

describe("$enter animation", () => {
  it("adds animation class on mount", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("enter_class"),
        g: {},
        layout: {
          "text:hello": { $content: "'Hello'", $enter: "'slex-fade-in'" },
        },
      },
      document.getElementById("app")!,
    );
    const el = document.querySelector(".slex-text")!;
    expect(el.classList.contains("slex-fade-in")).toBe(true);
  });

  it("removes animation class on animationend", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("enter_end"),
        g: {},
        layout: {
          "text:hello": { $content: "'Hello'", $enter: "'slex-fade-in'" },
        },
      },
      document.getElementById("app")!,
    );
    const el = document.querySelector(".slex-text")!;
    expect(el.classList.contains("slex-fade-in")).toBe(true);
    el.dispatchEvent(new AnimationEvent("animationend"));
    expect(el.classList.contains("slex-fade-in")).toBe(false);
  });

  it("conditional $enter expression works", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const dsl = {
      namespace: unique("enter_cond"),
      g: { anim: "slex-slide-in" },
      layout: { "text:x": { $content: "'X'", $enter: "g.anim" } },
    };
    mount(dsl, document.getElementById("app")!);
    const el = document.querySelector(".slex-text")!;
    expect(el.classList.contains("slex-slide-in")).toBe(true);
  });
});
