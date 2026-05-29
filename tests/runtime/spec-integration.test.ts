import { describe, it, expect } from "bun:test";
import { mount } from "../../src/engine/index";
import "../../src/components/index";

const industrialExpression = {
  namespace: "industrial_monitor_test",
  g: {
    thresholdOffset: 0,
    coolingEnabled: true,
    sensors: [
      { id: "temp_main", name: "主舱温度", val: 85, baseThreshold: 80, unit: "°C" },
      { id: "temp_bat", name: "电池温度", val: 45, baseThreshold: 70, unit: "°C" },
      { id: "press_01", name: "管道压力", val: 1.1, baseThreshold: 2.0, unit: "MPa" },
    ],
    isSystemCritical() {
      return this.sensors.some((s: { val: number; baseThreshold: number }) =>
        s.val > s.baseThreshold + this.thresholdOffset,
      );
    },
    criticalCount() {
      let count = 0;
      for (const s of this.sensors) {
        if (s.val > s.baseThreshold + this.thresholdOffset) count++;
      }
      return count;
    },
  },
  layout: {
    "column:main": {
      "card:globalCtrl": {
        title: "系统全局控制",
        "grid:": {
          columns: 2,
          "slider:offset": {
            min: -10,
            max: 20,
            step: 1,
            label: "阈值偏移量",
            $value: "g.thresholdOffset",
            onchange: "g.thresholdOffset = $event",
          },
          "switch:cooling": {
            label: "强制冷却系统",
            $enabled: "g.coolingEnabled",
            onchange: "g.coolingEnabled = $event",
          },
        },
      },
      "card:sensorList": {
        title: "实时传感器矩阵",
        "grid:": {
          columns: 3,
          "stat:sensor": {
            $for: "g.sensors",
            $key: "id",
            $label: "sensor.name",
            $value: "sensor.val + ' ' + sensor.unit",
            $type:
              "sensor.val > (sensor.baseThreshold + g.thresholdOffset) ? 'danger' : 'normal'",
          },
        },
      },
      "card:alertPanel": {
        $if: "g.isSystemCritical()",
        title: "系统过载警告",
        "grid:": {
          columns: 1,
          "stat:count": {
            label: "超限传感器数",
            $value: "g.criticalCount()",
            type: "danger",
          },
        },
      },
    },
  },
};

describe("industrial monitor integration spec", () => {
  it("mounts the Slex expression and renders container", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    mount(industrialExpression, container);
    const root = container.querySelector(".slexkit-root");
    expect(root).toBeTruthy();
    if (root) expect(root.dataset.namespace).toBe("industrial_monitor_test");
  });

  it("renders all static cards", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    mount(industrialExpression, container);
    const cards = container.querySelectorAll(".slex-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it("renders sensor list via $for with correct count", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    mount(industrialExpression, container);
    const metrics = container.querySelectorAll(".slex-stat");
    expect(metrics.length).toBe(4);
  });

  it("renders $if panel when condition is true", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    mount(industrialExpression, container);
    const panels = container.querySelectorAll(".slex-card-title");
    const alertTitles = Array.from(panels).filter(
      (el) => el.textContent === "系统过载警告",
    );
    expect(alertTitles.length).toBe(1);
  });

  it("renders the slider control", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    mount(industrialExpression, container);
    const slider = container.querySelector('.slex-slider');
    expect(slider).toBeTruthy();
    const label = container.querySelector('.slex-slider-label');
    expect(label?.textContent).toContain("阈值偏移量");
  });

  it("renders the switch control with correct default", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    mount(industrialExpression, container);
    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeTruthy();
    expect((checkbox as HTMLInputElement).checked).toBe(true);
  });

  it("treats ordinary string props as static text even when they contain sensor paths", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;

    mount({
      namespace: `static_sensor_string_${Date.now()}`,
      g: {},
      layout: {
        "text:literal": { text: "sensor.name" },
      },
    }, container);

    expect(container.querySelector(".slex-text")?.textContent).toBe("sensor.name");
  });
});

describe("multi-stream namespace merging", () => {
  it("merges state from two mounts in same namespace", () => {
    document.body.innerHTML = '<div id="app1"></div><div id="app2"></div>';
    const c1 = document.getElementById("app1")!;
    const c2 = document.getElementById("app2")!;

    mount({ namespace: "merge_test", g: { a: 1, b: 2 }, layout: { "text:t1": { text: "first" } } }, c1);
    mount({ namespace: "merge_test", g: { b: 3, c: 4 }, layout: { "text:t2": { text: "second" } } }, c2);

    expect(c1.querySelector(".slexkit-root")).toBeTruthy();
    expect(c2.querySelector(".slexkit-root")).toBeTruthy();
  });
});
