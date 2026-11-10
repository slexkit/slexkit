import { describe, expect, it } from "bun:test";
import { inspectSlexSource } from "../../src/html/inspect";

describe("removed structural directive language", () => {
  it("rejects $for, $if, $item, and event statement object sources", () => {
    for (const source of [
      '({layout:{"text:":{$for:"g.items",$text:"$item"}}})',
      '({layout:{"text:x":{$if:"g.show",text:"x"}}})',
      '({layout:{"button:x":{onclick:"g.count++"}}})',
    ]) expect(inspectSlexSource(source).diagnostic?.code).toBe("legacy-object-source");
  });

  it("uses ordinary DOM iteration, conditions, and events", () => {
    const root = document.createElement("div"); const items = ["a", "b", "c"];
    root.append(...items.map(item => Object.assign(document.createElement("span"), { textContent: item })));
    let count = 0; const button = document.createElement("button"); button.addEventListener("click", () => count++); button.click();
    expect(root.children).toHaveLength(3); expect(count).toBe(1);
  });
});
