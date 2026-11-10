import { defineSlexElements } from "/dist/web-components.js";

// Host-owned bootstrap. Generated content does not choose component code or URLs.
defineSlexElements();

// Standard JavaScript; no component-tree syntax or expression strings.
export function connectCalculator(root) {
  const voltage = root.querySelector('[name="voltage"]');
  const current = root.querySelector('[name="current"]');
  const power = root.querySelector("slex-stat");
  const reset = root.querySelector("slex-button");
  const initial = [voltage.value, current.value];
  const controller = new AbortController();
  const update = () => {
    const value = voltage.valueAsNumber * current.valueAsNumber;
    power.value = Number.isFinite(value) ? value : "请输入有效数值";
  };
  root.addEventListener("input", update, { signal: controller.signal });
  reset.addEventListener("click", () => {
    [voltage.value, current.value] = initial;
    update();
  }, { signal: controller.signal });
  update();
  // Markdown hosts call this before removing their document instance.
  return () => controller.abort();
}

const cleanups = [...document.querySelectorAll(".calculator")].map(connectCalculator);
window.addEventListener("pagehide", () => cleanups.forEach((cleanup) => cleanup()), { once: true });

const table = document.querySelector("slex-table");
table.columns = [{ key: "parameter", label: "参数" }, { key: "unit", label: "单位" }];
table.rows = [{ parameter: "电压", unit: "V" }, { parameter: "电流", unit: "A" }, { parameter: "功率", unit: "W" }];
document.querySelector("#theme").addEventListener("click", () => document.documentElement.classList.toggle("dark"));
