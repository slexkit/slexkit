import { describe, expect, it } from "bun:test";
import { mount } from "../../src/engine/index";
import "../../src/components/index";

function sleep(ms = 30) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function unique(ns = "text") {
  return `${ns}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

describe("text component", () => {
  it("renders dynamic color and numeric font size for styled previews", async () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount({
      namespace: unique("styled_preview"),
      g: { color: "purple", size: 12 },
      layout: {
        "text:preview": {
          $text: "g.color",
          $color: "g.color",
          $size: "g.size",
        },
      },
    }, document.getElementById("app")!);

    await sleep();

    const preview = document.querySelector(".slex-text") as HTMLElement;
    expect(preview.textContent).toBe("purple");
    expect(preview.style.color).toBe("purple");
    expect(preview.style.fontSize).toBe("12px");
  });
});
