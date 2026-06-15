import { describe, it, expect } from "bun:test";
import { mount } from "../../src/engine/index";
import "../../src/components/index";

function sleep(ms = 40) {
  return new Promise((r) => setTimeout(r, ms));
}

function unique(ns = "v019") {
  return `${ns}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
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

describe("feedback components", () => {

    it("progress renders value semantics", () => {
      document.body.innerHTML = '<div id="app"></div>';
      mount(
        {
          namespace: unique("progress"),
          g: { value: 42 },
          layout: {
            "progress:load": {
              $value: "g.value",
              label: "Loading",
            },
          },
        },
        document.getElementById("app")!,
      );

      const root = document.querySelector(".slex-progress")!;
      expect(root.getAttribute("data-scope")).toBe("progress");
      expect(root.getAttribute("aria-valuenow")).toBe("42");
    });


    it("toast renders a notification group and closable item", async () => {
      document.body.innerHTML = '<div id="app"></div>';
      mount(
        {
          namespace: unique("toast"),
          g: {},
          layout: {
            "toast:notice": {
              title: "Saved",
              description: "Changes persisted",
              type: "success",
              duration: 10000,
            },
          },
        },
        document.getElementById("app")!,
        { labels: { "toast.close": "Dismiss notice" } },
      );

      await sleep();
      const group = document.querySelector(".slex-toast-group");
      const item = document.querySelector(".slex-toast");
      expect(group?.getAttribute("data-scope")).toBe("toast");
      expect(item?.getAttribute("data-tone")).toBe("success");
      expect(item?.getAttribute("role")).toBe("status");
      expect(item?.textContent).toContain("Saved");
      expect(document.querySelector(".slex-toast-close .sr-only")?.textContent).toBe("Close");
      expect(document.querySelector(".slex-toast-close")?.getAttribute("aria-label")).toBe("Dismiss notice");

      (document.querySelector(".slex-toast-close") as HTMLButtonElement).click();
      await sleep();
      expect(document.querySelector(".slex-toast")).toBeNull();
    });

  it("callout renders children without duplicating text prop", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("callout_no_dup"),
        g: {},
        layout: {
          "callout:info": {
            tone: "info",
            text: "Fallback text",
            "text:child": { text: "Child content" },
          },
        },
      },
      document.getElementById("app")!,
    );
    const body = document.querySelector(".slex-callout-body");
    expect(body?.textContent).toBe("Child content");
    expect(body?.textContent).not.toContain("Fallback text");
  });
});
