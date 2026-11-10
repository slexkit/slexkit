import { chromium, firefox, webkit } from "playwright";

const name = process.argv[2] ?? "chromium";
const engine = { chromium, firefox, webkit }[name];
if (!engine) throw new Error(`Unknown browser ${name}`);

const browserServer = await engine.launchServer({ headless: true });
const browser = await engine.connect(browserServer.wsEndpoint());
const page = await browser.newPage();
page.setDefaultTimeout(15000);
await page.goto("http://127.0.0.1:4197/");
await page.evaluate(async () => {
  window.__slexRuntime = await import("/dist/slexkit.js");
});

console.log(
  JSON.stringify({
    marker: "infinite-computation-start",
    browser: name,
    browserPid: browserServer.process().pid,
    emittedImmediatelyBeforeBlockingPayload: true,
  }),
);
await new Promise((resolve) => setImmediate(resolve));

await page.evaluate(async () => {
  const handle = window.__slexRuntime.mount(
    '<p id="started">blocking payload</p><script>for (;;) { Math.sqrt(144); }</script>',
    document.querySelector("#root"),
    {
      secureFrame: { runtimeUrl: new URL("/dist/slexkit.js", location.href).href, styleUrl: false },
    },
  );
  await handle.ready;
});

throw new Error(
  "Infinite computation unexpectedly returned without external process-tree termination.",
);
