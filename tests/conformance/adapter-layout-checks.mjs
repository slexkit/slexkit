import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

/** The same authored HTML is exercised through each real adapter, inside its frame. */
export async function verifyAdapterLayout(page, route, browser, output) {
  await page.evaluate(route => window.harness.start(route, window.harness.layoutSource), route);
  const frame = page.frameLocator("#app iframe");
  const input = frame.locator("#layout-input input");
  await input.waitFor();
  await input.press("ControlOrMeta+A");
  await input.pressSequentially("37.25");
  await page.waitForTimeout(100);
  assert.equal(await frame.locator("#metric-power").evaluate(element => element.value), 74.5);
  const identity = await input.evaluate(node => {
    const document = node.ownerDocument;
    document.__layoutInput = node;
    document.__layoutNumber = document.querySelector("#metric-pi").shadowRoot.querySelector(".slex-stat-number");
    return true;
  });
  assert.equal(identity, true);
  const layouts = [];
  for (const theme of ["light", "dark"]) {
    await page.evaluate(theme => { document.documentElement.className = theme; document.documentElement.dataset.theme = theme; }, theme);
    for (const width of [1024, 320, 390, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(200);
      const layout = await frame.locator("#metrics").evaluate(row => {
        const layout = row.shadowRoot.querySelector(".slex-row"), bounds = layout.getBoundingClientRect();
        const items = [...row.children].map(host => {
          const root = host.shadowRoot, card = root.querySelector(".slex-stat"), box = host.getBoundingClientRect(), value = root.querySelector(".slex-stat-value"), number = root.querySelector(".slex-stat-number");
          return { x: box.x, y: box.y, width: box.width, height: box.height, innerHeight: card.getBoundingClientRect().height, bottom: value.getBoundingClientRect().bottom, clipped: number.scrollWidth > number.clientWidth + 1, display: number.textContent, color: getComputedStyle(card).color, background: getComputedStyle(card).backgroundColor };
        });
        return { x: bounds.x, width: bounds.width, display: getComputedStyle(layout).display, overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), identity: document.querySelector("#layout-input").shadowRoot.querySelector("input") === document.__layoutInput, numberIdentity: document.querySelector("#metric-pi").shadowRoot.querySelector(".slex-stat-number") === document.__layoutNumber, items };
      });
      assert.equal(layout.display, "grid", `${browser}/${route}/${width}: automatic balancing`);
      assert.ok(layout.overflow <= 1, `${browser}/${route}/${width}: frame overflow`);
      assert.equal(layout.identity, true); assert.equal(layout.numberIdentity, true);
      const rows = new Map();
      for (const item of layout.items) {
        assert.equal(item.clipped, false, `${browser}/${route}/${width}: finite value fits`);
        assert.ok(Math.abs(item.height - item.innerHeight) <= 1);
        const y = Math.round(item.y); if (!rows.has(y)) rows.set(y, []); rows.get(y).push(item);
      }
      for (const items of rows.values()) {
        assert.ok(Math.abs(items[0].x - layout.x) <= 1);
        assert.ok(Math.abs(items.at(-1).x + items.at(-1).width - layout.x - layout.width) <= 1);
        assert.ok(Math.max(...items.map(item => item.height)) - Math.min(...items.map(item => item.height)) <= 1);
        assert.ok(Math.max(...items.map(item => item.bottom)) - Math.min(...items.map(item => item.bottom)) <= 1);
      }
      assert.equal(await input.inputValue(), "37.25");
      layouts.push({ theme, viewport: width, ...layout, passed: true });
      if (width === 390) await page.screenshot({ path: fileURLToPath(new URL(`${route}-layout-${theme}.png`, output)), fullPage: true, animations: "disabled" });
    }
  }
  await input.focus();
  await input.evaluate(node => node.setSelectionRange(1, 4));
  const revised = await page.evaluate(() => {
    const source = window.harness.layoutSource.replace('value="12"', 'value="24"');
    const document = new DOMParser().parseFromString(source, "text/html");
    const row = document.querySelector("#metrics"); row.append(row.firstElementChild);
    document.querySelector("#metric-current").setAttribute("label", "更新后的长中文标签与额定参数");
    return document.body.innerHTML;
  });
  await page.evaluate(source => window.harness.update(source), revised);
  await page.waitForTimeout(200);
  const state = await input.evaluate(node => ({ same: node === node.ownerDocument.__layoutInput, value: node.value, focused: node.getRootNode().activeElement === node, selection: [node.selectionStart, node.selectionEnd], runs: node.ownerDocument.defaultView.__layoutRuns }));
  assert.deepEqual(state, { same: true, value: "37.25", focused: true, selection: [1, 4], runs: 1 });
  assert.equal(await frame.locator("#metric-pi").evaluate(element => element.shadowRoot.querySelector(".slex-stat-number") === element.ownerDocument.__layoutNumber), true);
  const changedModule = revised.replace("</script>", "// module revision 2\n</script>");
  await page.evaluate(source => window.harness.update(source), changedModule);
  await page.waitForTimeout(200);
  assert.equal(await frame.locator("#layout-input").evaluate(element => element.ownerDocument.defaultView.__layoutRuns), 2);
  const updates = await frame.locator("#layout-input").evaluate(element => element.ownerDocument.defaultView.__layoutUpdates);
  await input.press("End"); await input.pressSequentially("0");
  assert.equal(await frame.locator("#layout-input").evaluate(element => element.ownerDocument.defaultView.__layoutUpdates), updates + 1, "changed module releases its previous input listener");
  const liveValue = await input.inputValue();
  if (!["playground", "tiptap"].includes(route)) {
    await page.evaluate(source => window.harness.update(source + '<script type="module">const =', "preview"), changedModule).catch(error => assert.match(error.message, /incomplete-script/));
    assert.equal(await frame.locator("#layout-input").evaluate(element => element.ownerDocument.defaultView.__layoutRuns), 2);
    assert.equal(await input.inputValue(), liveValue);
    await page.evaluate(source => window.harness.update(source), changedModule);
  }
  if (route !== "playground") {
    await page.evaluate(source => window.harness.update(source + '<script type="module">const = 1</script>'), changedModule).catch(() => {});
    assert.equal(await input.inputValue(), liveValue);
    await page.evaluate(source => window.harness.update(source), changedModule);
    await page.evaluate(() => window.harness.reset());
    await page.waitForTimeout(150);
    assert.equal(await input.inputValue(), "24");
  }
  await page.evaluate(() => window.harness.dispose());
  await page.waitForFunction(() => !document.querySelector("#app iframe"));
  return { layouts, keyboard: true, state, contentUpdate: true, teardown: true };
}
