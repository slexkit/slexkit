import { describe, expect, it } from "bun:test";
import { mountSlexElement } from "../helpers";

describe("stat custom element", () => {
  it("renders value and unit separately and updates live", () => {
    const stat = mountSlexElement("stat", { label: "Power", value: 2.3000000000000003, unit: "W" });
    expect(stat.shadowRoot!.querySelector(".slex-stat-number")!.textContent).toBe("2.3");
    expect(stat.shadowRoot!.textContent).toContain("W");
    stat.value = 4;
    expect(stat.shadowRoot!.textContent).toContain("4");
  });

  it("bounds numeric display precision without changing the live value", () => {
    const stat = mountSlexElement("stat", { label: "Angle", value: Math.PI, unit: "rad" });
    expect(stat.shadowRoot!.querySelector(".slex-stat-number")!.textContent).toBe("3.14159");
    expect(stat.value).toBe(Math.PI);
    expect(stat.shadowRoot!.querySelector(".slex-stat-value")!.getAttribute("title")).toBe(`${Math.PI} rad`);
    expect(stat.shadowRoot!.querySelector(".slex-stat-accessible-value")!.textContent).toBe(`${Math.PI} rad`);
    stat.value = 0.1 + 0.2;
    expect(stat.shadowRoot!.querySelector(".slex-stat-number")!.textContent).toBe("0.3");
    expect(stat.value).toBe(0.1 + 0.2);
  });

  it("retains authored strings and exact identifiers", () => {
    const stat = mountSlexElement("stat", { value: "1.000" });
    const number = () => stat.shadowRoot!.querySelector(".slex-stat-number")!;
    expect(number().textContent).toBe("1.000");
    stat.value = "9007199254740993123456789";
    expect(number().textContent).toBe("9007199254740993123456789");
    expect(stat.value).toBe("9007199254740993123456789");
    stat.value = "Waiting for a measurement";
    expect(number().textContent).toBe("Waiting for a measurement");
  });

  it("continues to animate changed digits on live numeric updates", () => {
    const stat = mountSlexElement("stat", { value: 1000 });
    stat.value = 1001;
    expect(stat.shadowRoot!.querySelector(".slex-stat-number")!.textContent).toBe("1001");
    expect(stat.shadowRoot!.querySelectorAll('[data-stat-change="up"]').length).toBeGreaterThan(0);
  });

  it("keeps numerical order independent of RTL while preserving text shaping", () => {
    const stat = mountSlexElement("stat", { value: -123.456 });
    const number = () => stat.shadowRoot!.querySelector<HTMLElement>(".slex-stat-number")!;
    expect(number().dir).toBe("ltr");
    stat.value = "9007199254740993123456789";
    expect(number().dir).toBe("ltr");
    stat.value = "قيد المعالجة";
    expect(number().dir).toBe("auto");
    expect(number().textContent).toBe("قيد المعالجة");
    expect(number().querySelectorAll(".slex-stat-character").length).toBe(0);
  });

  it("keeps tone and initial-animation configuration scalar", () => {
    const stat = mountSlexElement("stat", { tone: "success", animateInitial: true });
    expect(stat.tone).toBe("success");
    expect(stat.animateInitial).toBe(true);
  });
});
