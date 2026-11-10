import { describe, expect, it } from "bun:test";
import { mountSlexElement, sleep } from "../helpers";

describe("layout custom elements", () => {
  it("row and grid preserve authored children as direct slotted items", () => {
    for (const type of ["row", "grid"] as const) {
      const first = document.createElement("span");
      const second = document.createElement("span");
      const layout = mountSlexElement(type, { gap: "md" }, [first, second]);
      expect(Array.from(layout.children)).toEqual([first, second]);
      expect(layout.shadowRoot!.querySelector("slot")).toBeTruthy();
    }
  });

  it("grid accepts responsive scalar properties without a tile-balancing heuristic", () => {
    const grid = mountSlexElement("grid", { columns: 2, mdColumns: 4 });
    expect(grid.columns).toBe(2);
    expect((grid as unknown as { mdColumns: number }).mdColumns).toBe(4);
  });

  it("balances assigned metric tiles and releases layout ownership on explicit alignment", async () => {
    const tiles = Array.from({ length: 5 }, () => document.createElement("slex-stat"));
    tiles[0].style.gridColumn = "span 7";
    const row = mountSlexElement("row", {}, tiles);
    await sleep();
    const layout = row.shadowRoot!.querySelector<HTMLElement>(".slex-row")!;
    expect(layout.classList.contains("slex-row--balanced-tiles")).toBe(true);
    expect(tiles.every(tile => tile.getAttribute("data-slex-balanced-tile") === "stat")).toBe(true);
    expect(Array.from(row.children)).toEqual(tiles);
    (row as unknown as { align: string }).align = "start";
    await sleep();
    expect(layout.classList.contains("slex-row--balanced-tiles")).toBe(false);
    expect(tiles[0].style.gridColumn).toBe("span 7");
    expect(tiles.every(tile => !tile.hasAttribute("data-slex-balanced-tile"))).toBe(true);
    (row as unknown as { align: string }).align = "";
    await sleep();
    expect(layout.classList.contains("slex-row--balanced-tiles")).toBe(true);
    row.remove();
    await sleep();
    expect(tiles[0].style.gridColumn).toBe("span 7");
    expect(tiles.every(tile => !tile.hasAttribute("data-slex-balanced-tile"))).toBe(true);
  });

  it("leaves mixed and meaningful text content in normal flex layout", async () => {
    for (const children of [
      [document.createElement("slex-stat"), document.createElement("button")],
      [document.createElement("slex-stat"), document.createTextNode("and"), document.createElement("slex-stat")],
    ]) {
      const row = mountSlexElement("row", {}, children);
      await sleep();
      expect(row.shadowRoot!.querySelector(".slex-row--balanced-tiles")).toBeNull();
    }
  });

  it("transfers tile ownership during same-turn row moves", async () => {
    const tiles = Array.from({ length: 3 }, () => document.createElement("slex-stat"));
    const first = mountSlexElement("row", {}, tiles);
    const second = document.createElement("slex-row");
    second.append(document.createElement("slex-stat"));
    document.body.append(second);
    await sleep(70);
    second.append(tiles[0]);
    await sleep(100);
    expect(tiles[0].getAttribute("data-slex-balanced-tile")).toBe("stat");
    first.remove();
    second.remove();
    await sleep();
    expect(tiles[0].hasAttribute("data-slex-balanced-tile")).toBe(false);
    expect(tiles[0].style.gridColumn).toBe("");
  });
});
