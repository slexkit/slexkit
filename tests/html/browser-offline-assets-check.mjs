import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import http from "node:http";
import { chromium, firefox, webkit } from "playwright";

const browserName =
  process.argv.find((value) => ["chromium", "firefox", "webkit"].includes(value)) ?? "chromium";
const engine = { chromium, firefox, webkit }[browserName];
const runtimeBytes = await readFile(new URL("../../dist/slexkit.js", import.meta.url));
const cssBytes = await readFile(new URL("../../dist/slexkit.css", import.meta.url));
const fontBytes = await readFile(
  new URL("../../node_modules/katex/dist/fonts/KaTeX_Main-Regular.woff2", import.meta.url),
);
const runtimeDataUrl = `data:text/javascript;base64,${runtimeBytes.toString("base64")}`;
const fontDataUrl = `data:font/woff2;base64,${fontBytes.toString("base64")}`;
const cssText = `${cssBytes.toString("utf8")}
@font-face{font-family:ObsidianDataFont;src:url("${fontDataUrl}") format("woff2");font-weight:400}
.slex-button{font-family:ObsidianDataFont,serif}`;
const cssDataUrl = `data:text/css;base64,${Buffer.from(cssText).toString("base64")}`;

const server = http.createServer(async (request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  response.setHeader("access-control-allow-origin", "*");
  if (path === "/host") {
    response.setHeader("content-type", "text/html");
    response.setHeader(
      "content-security-policy",
      "style-src 'unsafe-inline' 'self' https:; script-src 'unsafe-inline' 'unsafe-eval' 'self' data: blob:",
    );
    response.end("<!doctype html><main id='root'></main>");
  } else if (path === "/dist/slexkit.js") {
    response.setHeader("content-type", "text/javascript");
    response.end(runtimeBytes);
  } else {
    response.statusCode = 404;
    response.end("missing");
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browserServer = await engine.launchServer({ headless: true });
const browser = await engine.connect(browserServer.wsEndpoint());
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(20_000);
  await page.goto(`${origin}/host`);
  await page.evaluate(
    async ({ fontUrl, hostRuntimeUrl, runtimeUrl, styleUrl }) => {
      const hostRuntime = await import(hostRuntimeUrl);
      globalThis.handle = hostRuntime.mount(
        `<style>#offline{color:rgb(21, 43, 65);padding:13px;font-family:"Courier New";font-size:19px}</style>
      <p id="offline">offline</p><slex-button id="component">Works</slex-button>
      <script>slex.root.dataset.moduleBlob="ran"</script>`,
        document.querySelector("#root"),
        {
          secureFrame: { runtimeUrl, styleUrl, fontUrls: [fontUrl] },
        },
      );
      await globalThis.handle.ready;
    },
    {
      hostRuntimeUrl: `${origin}/dist/slexkit.js`,
      fontUrl: fontDataUrl,
      runtimeUrl: runtimeDataUrl,
      styleUrl: cssDataUrl,
    },
  );
  const frame = page.frameLocator("#root iframe");
  await frame.locator("#component").waitFor();
  assert.equal(
    await frame.locator("#offline").evaluate((node) => getComputedStyle(node).color),
    "rgb(21, 43, 65)",
  );
  const payloadStyle = await frame.locator("#offline").evaluate((node) => {
    const style = getComputedStyle(node);
    return [style.paddingTop, style.fontFamily, style.fontSize];
  });
  assert.equal(payloadStyle[0], "13px");
  assert.equal(payloadStyle[1].replaceAll('"', ""), "Courier New");
  assert.equal(payloadStyle[2], "19px");
  assert.equal(
    await frame
      .locator("#offline")
      .evaluate((node) => node.closest("#slex-root")?.dataset.moduleBlob),
    "ran",
  );
  assert.deepEqual(
    await frame.locator("#component").evaluate((node) => {
      const button = node.shadowRoot?.querySelector("button");
      if (!button) return [];
      const style = getComputedStyle(button);
      return [style.paddingTop, style.paddingLeft, style.fontSize, style.fontFamily];
    }),
    ["8px", "16px", "14px", "ObsidianDataFont, serif"],
  );
  assert.equal(
    await frame
      .locator("#component")
      .evaluate((node) => node.shadowRoot?.querySelector('link[rel="stylesheet"]')),
    null,
  );
  assert.equal(await frame.locator("html").evaluate(() => document.adoptedStyleSheets.length), 1);
  assert.deepEqual(await frame.locator("html").evaluate(async () => {
    const loaded = await document.fonts.load('14px ObsidianDataFont', 'Works');
    return loaded.map(font => font.status);
  }), ['loaded']);
  await page.evaluate(() =>
    globalThis.handle.update(`<style>#offline{color:rgb(31, 53, 75);padding:17px}</style>
      <p id="offline">updated</p><slex-button id="component">Works</slex-button>
      <script>slex.root.dataset.moduleBlob="ran"</script>`),
  );
  assert.deepEqual(
    await frame.locator("#offline").evaluate((node) => {
      const style = getComputedStyle(node);
      return [style.color, style.paddingTop];
    }),
    ["rgb(31, 53, 75)", "17px"],
  );
  assert.equal(await frame.locator("html").evaluate(() => document.adoptedStyleSheets.length), 1);
  assert.equal(
    await page.evaluate(async () => {
      try {
        await globalThis.handle.update(`<style>#offline{color:rgb(99, 1, 2)}</style>
          <p id="offline">broken</p><script>throw new Error("rollback probe")</script>`);
        return false;
      } catch {
        return true;
      }
    }),
    true,
  );
  assert.deepEqual(
    await frame.locator("#offline").evaluate((node) => {
      const style = getComputedStyle(node);
      return [node.textContent, style.color, style.paddingTop, document.adoptedStyleSheets.length];
    }),
    ["updated", "rgb(31, 53, 75)", "17px", 1],
  );
  console.log(
    `${browserName}: inherited Obsidian CSP, data runtime/CSS/font, payload style lifecycle, and shadow geometry passed`,
  );
} finally {
  await browser.close();
  await browserServer.close();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}
