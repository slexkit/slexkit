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

describe("row layout component", () => {
  it("renders children inside slex-row container", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("row"),
        g: {},
        layout: {
          "row:r": {
            "text:a": { $content: "'A'" },
            "text:b": { $content: "'B'" },
          },
        },
      },
      document.getElementById("app")!,
    );
    const row = document.querySelector(".slex-row");
    expect(row).toBeTruthy();
    expect(row!.children).toHaveLength(2);
    const texts = row!.querySelectorAll(".slex-text");
    expect(texts).toHaveLength(2);
    expect(texts[0].textContent).toBe("A");
    expect(texts[1].textContent).toBe("B");
  });

  it("keeps children as direct flex items without layout spacing props", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("row_direct"),
        g: {},
        layout: {
          "row:r": {
            "text:a": { $content: "'A'" },
            "text:b": { $content: "'B'" },
          },
        },
      },
      document.getElementById("app")!,
    );
    const row = document.querySelector(".slex-row") as HTMLElement;
    expect(row.children).toHaveLength(2);
    expect(row.style.gap).toBe("");
  });

  it("applies explicit semantic gap without changing the default gap", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("row_gap"),
        g: {},
        layout: {
          "row:r": {
            gap: "0.5rem",
            "text:a": { $content: "'A'" },
            "text:b": { $content: "'B'" },
          },
        },
      },
      document.getElementById("app")!,
    );
    const row = document.querySelector(".slex-row") as HTMLElement;
    expect(row.children).toHaveLength(2);
    expect(row.style.gap).toBe("0.5rem");
  });

  it("balances homogeneous stat rows with stretched equal columns", async () => {
    document.body.innerHTML = '<div id="app" style="width: 640px;"></div>';
    mount(
      {
        namespace: unique("row_stat_tiles"),
        layout: {
          "row:tones": {
            "stat:info": { label: "Info", value: "42" },
            "stat:success": { label: "Success", value: "98%" },
            "stat:warning": { label: "Warning", value: "73" },
            "stat:danger": { label: "Danger", value: "5" },
            "stat:muted": { label: "Muted", value: "0" },
          },
        },
      },
      document.getElementById("app")!,
    );
    const css = await Bun.file("src/styles/layout.css").text();

    await sleep();
    const row = document.querySelector(".slex-row") as HTMLElement;
    expect(row.classList.contains("slex-row--balanced-tiles")).toBe(true);
    expect(row.getAttribute("data-tile-kind")).toBe("stat");
    expect(row.style.getPropertyValue("--slex-balanced-cols")).toBeTruthy();
    expect(row.style.getPropertyValue("--slex-balanced-tracks")).toBeTruthy();
    expect(Array.from(row.children).every((child) => (child as HTMLElement).style.gridColumn.startsWith("span "))).toBe(
      true,
    );
    expect(css).toContain("grid-template-columns: repeat(var(--slex-balanced-tracks");
    expect(css).toContain("minmax(0, 1fr)");
    expect(css).toContain("justify-content: stretch");
    expect(css).not.toContain("flex: 1 1 10rem");
  });

  it("chooses balanced columns for tile groups", () => {
    expect(chooseBalancedColumns({ itemCount: 5, containerWidth: 640, targetTileWidth: 136, gap: 16 })).toBe(3);
    expect(chooseBalancedColumns({ itemCount: 8, containerWidth: 760, targetTileWidth: 136, gap: 16 })).toBe(4);
    expect(chooseBalancedColumns({ itemCount: 7, containerWidth: 640, targetTileWidth: 136, gap: 16 })).toBe(4);
  });

  it("stretches partial final tile rows without leaving an empty column", () => {
    expect(createBalancedTileLayout(5, 3)).toEqual({
      columns: 3,
      tracks: 6,
      spans: [2, 2, 2, 3, 3],
    });
    expect(createBalancedTileLayout(7, 4)).toEqual({
      columns: 4,
      tracks: 12,
      spans: [3, 3, 3, 3, 4, 4, 4],
    });
  });
});


describe("grid layout component", () => {
  it("renders children as direct grid items", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("grid_direct"),
        g: {},
        layout: {
          "grid:g": {
            columns: 3,
            "stat:a": { label: "A", value: 1 },
            "stat:b": { label: "B", value: 2 },
            "stat:c": { label: "C", value: 3 },
          },
        },
      },
      document.getElementById("app")!,
    );
    const grid = document.querySelector(".slex-grid") as HTMLElement;
    expect(grid).toBeTruthy();
    expect(grid.getAttribute("data-cols")).toBe("3");
    expect(grid.style.gap).toBe("");
    expect(grid.children).toHaveLength(3);
    expect(Array.from(grid.children).every((child) => child.classList.contains("slex-stat"))).toBe(true);
  });

  it("applies explicit semantic gap without changing default grid spacing", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("grid_gap"),
        g: {},
        layout: {
          "grid:g": {
            columns: 2,
            gap: "2rem",
            "stat:a": { label: "A", value: 1 },
            "stat:b": { label: "B", value: 2 },
          },
        },
      },
      document.getElementById("app")!,
    );
    const grid = document.querySelector(".slex-grid") as HTMLElement;
    expect(grid.getAttribute("data-cols")).toBe("2");
    expect(grid.style.gap).toBe("2rem");
    expect(grid.children).toHaveLength(2);
  });
});
