import assert from "node:assert/strict";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "../..");
const contentTypes = { ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" };
const serverHits = [];
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");
  serverHits.push(url.pathname);
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("cache-control", "no-store");
  if (url.pathname === "/") {
    response.setHeader("content-type", "text/html");
    response.end('<!doctype html><html class="dark"><head><style>#root{--primary:rgb(255,0,0)}</style></head><body><div id="root"></div></body></html>');
    return;
  }
  if (!url.pathname.startsWith("/dist/")) { response.statusCode = 404; response.end("missing"); return; }
  try {
    const file = resolve(root, `.${url.pathname}`);
    response.setHeader("content-type", contentTypes[extname(file)] ?? "application/octet-stream");
    response.end(await readFile(file));
  } catch { response.statusCode = 404; response.end("missing"); }
});
await new Promise(resolveListen => server.listen(0, "127.0.0.1", resolveListen));
const origin = `http://127.0.0.1:${server.address().port}`;
const browserServer = await chromium.launchServer({ headless: true });
const browser = await chromium.connect(browserServer.wsEndpoint());

const stable = `<input id="stable" value="default"><output id="marker">stable</output><script>
  if (!(slex.signal instanceof AbortSignal)) throw new Error("slex.signal is not an AbortSignal");
  addEventListener("scope-probe",()=>document.documentElement.dataset.oldHits="1",{signal:slex.signal});
  globalThis.setTimeout(()=>{try{slex.onDispose(()=>{});document.documentElement.dataset.stale="attached"}catch{document.documentElement.dataset.stale="rejected"}},120);
</script>`;

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(12_000);
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(origin);
  await page.evaluate(async ({ source, base }) => {
    const runtime = await import(`${base}/dist/slexkit.js`);
    window.runtime = runtime;
    window.handle = runtime.mount(source, document.querySelector("#root"), {
      secureFrame: { runtimeUrl: `${base}/dist/slexkit.js`, styleUrl: `${base}/dist/slexkit.css`, teardownTimeoutMs: 250 },
      policy: { network: { enabled: true, methods: ["GET"], allowOrigins: [base], credentials: "omit", timeoutMs: 2000, maxBodyBytes: 1024 } },
      hostAdapter: { fetch: async request => {
        await new Promise(resolve => setTimeout(resolve, 350));
        return { ok: true, status: 200, statusText: "OK", url: request.url, headers: {}, text: "late", elapsedMs: 350 };
      } },
    });
    await window.handle.ready;
  }, { source: stable, base: origin });
  const frame = page.frameLocator("#root iframe");

  await page.evaluate(async () => {
    const next = `<output id="result">pending</output><script>
      await new Promise(resolve=>globalThis.setTimeout(resolve,260));
      dispatchEvent(new Event("scope-probe"));
      slex.root.querySelector("#result").textContent=(document.documentElement.dataset.oldHits||"0")+":"+(document.documentElement.dataset.stale||"missing");
    </script>`;
    await window.handle.update(next);
  });
  assert.equal(await frame.locator("#result").textContent(), "0:rejected");

  const queued = await page.evaluate(async () => {
    const first = window.handle.update(`<output id="order">A</output><script>await new Promise(resolve=>globalThis.setTimeout(resolve,180));slex.root.querySelector("#order").textContent="A-done"</script>`);
    const second = window.handle.update(`<output id="order">B</output><script>slex.root.querySelector("#order").textContent="B-done"</script>`);
    return Promise.allSettled([first, second]);
  });
  assert.deepEqual(queued.map(item => item.status), ["fulfilled", "fulfilled"]);
  assert.equal(await frame.locator("#order").textContent(), "B-done");

  await page.evaluate(async base => {
    await window.handle.update(`<output id="api">waiting</output><script>
      slex.api.get(${JSON.stringify(`${origin}/late`)}).then(()=>document.documentElement.dataset.api="resolved",()=>document.documentElement.dataset.api="rejected");
    </script>`);
    await window.handle.update(`<output id="api">new</output><script>await new Promise(resolve=>globalThis.setTimeout(resolve,450));slex.root.querySelector("#api").textContent=document.documentElement.dataset.api||"missing"</script>`);
  }, origin);
  assert.equal(await frame.locator("#api").textContent(), "rejected");

  const initialTheme = await frame.locator("html").evaluate(element => ({ dark: element.classList.contains("dark"), token: element.style.getPropertyValue("--primary") }));
  assert.equal(initialTheme.dark, true);
  assert.match(initialTheme.token, /255/);
  await page.evaluate(() => { document.documentElement.className = "light"; document.querySelector("#root").style.setProperty("--primary", "rgb(0, 0, 255)"); });
  await page.waitForFunction(() => document.querySelector("#root iframe")?.style.height !== undefined);
  await page.waitForTimeout(80);
  const changedTheme = await frame.locator("html").evaluate(element => ({ light: element.classList.contains("light"), token: element.style.getPropertyValue("--primary") }));
  assert.equal(changedTheme.light, true);
  assert.match(changedTheme.token, /255/);

  await page.evaluate(async base => {
    await window.handle.update(`<output id="csp">pending</output><script>
      fetch(${JSON.stringify(`${origin}/blocked-runtime-connect`)}).catch(()=>{});
      const image=new Image();image.src=${JSON.stringify(`${origin}/blocked-runtime-image`)};document.body.append(image);
      const style=document.createElement("link");style.rel="stylesheet";style.href=${JSON.stringify(`${origin}/blocked-runtime-style`)};document.head.append(style);
      const child=document.createElement("iframe");child.src=${JSON.stringify(`${origin}/blocked-runtime-frame`)};document.body.append(child);
      try{new FontFace("blocked",${JSON.stringify(`url(${origin}/blocked-runtime-font)`)}).load().catch(()=>{})}catch{}
      await new Promise(resolve=>globalThis.setTimeout(resolve,300));slex.root.querySelector("#csp").textContent="attempted";
    </script>`);
  }, origin);
  assert.equal(await frame.locator("#csp").textContent(), "attempted");
  for (const path of ["connect", "image", "style", "frame", "font"]) {
    assert.ok(!serverHits.includes(`/blocked-runtime-${path}`), `actual frame CSP allowed ${path}`);
  }

  await page.evaluate(async () => { await window.handle.update(`<style>#tall{height:500px}</style><div id="tall"></div>`); });
  await page.waitForTimeout(50);
  const tallHeight = await page.locator("#root iframe").evaluate(element => parseFloat(element.style.height));
  await page.evaluate(async () => { await window.handle.update(`<style>#short{height:20px}</style><div id="short"></div>`); });
  await page.waitForTimeout(50);
  const shortHeight = await page.locator("#root iframe").evaluate(element => parseFloat(element.style.height));
  assert.ok(shortHeight < tallHeight, `expected iframe to shrink (${tallHeight} -> ${shortHeight})`);

  await page.evaluate(async () => { await window.handle.update(`<input id="snap" value="initial">`); });
  await frame.locator("#snap").fill("visible");
  const snapshot = await page.evaluate(() => window.handle.snapshot());
  assert.equal(snapshot.controls.snap.values.value, "visible");

  await page.evaluate(async source => { await window.handle.update(source); }, stable);
  await frame.locator("#stable").fill("edited");
  const failure = await page.evaluate(async () => {
    try { await window.handle.update(`<p id="broken">broken</p><script>throw new Error("module failed")</script>`); return "unexpected"; }
    catch (error) { return error.message; }
  });
  assert.match(failure, /module failed/);
  assert.equal(await frame.locator("#marker").textContent(), "stable");
  assert.equal(await frame.locator("#stable").inputValue(), "edited");

  await page.evaluate(async ({ source, base }) => {
    window.handle();
    const container = document.querySelector("#root");
    window.teardownHandle = window.runtime.mount(source, container, {
      secureFrame: { runtimeUrl: `${base}/dist/slexkit.js`, styleUrl: `${base}/dist/slexkit.css`, teardownTimeoutMs: 250 },
    });
    await window.teardownHandle.ready;
  }, { source: `<p>ready</p>`, base: origin });

  const teardown = await page.evaluate(async () => {
    const started = performance.now();
    const pending = window.teardownHandle.update(`<p>slow</p><script>await new Promise(resolve=>globalThis.setTimeout(resolve,5000))</script>`).then(()=>"fulfilled",()=>"rejected");
    await new Promise(resolve => setTimeout(resolve,20)); window.teardownHandle(); window.teardownHandle();
    return { status: await pending, elapsed: performance.now() - started };
  });
  assert.equal(teardown.status, "rejected");
  assert.ok(teardown.elapsed < 1000, `pending commit rejected too slowly: ${teardown.elapsed}ms`);
  await page.waitForFunction(() => !document.querySelector("#root iframe"));
  assert.deepEqual(pageErrors, []);
  console.log("Chromium lifecycle check passed: scope, queue, rollback, API, theme, height, snapshot, and teardown.");
} finally {
  await browser.close();
  await browserServer.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
