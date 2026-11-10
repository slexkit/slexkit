import { mount } from "/dist/slexkit.js";

const log = document.getElementById("network-log");
const events = [];
const writeLog = (entry) => { events.unshift(entry); log.textContent = events.slice(0, 8).map((item) => JSON.stringify(item, null, 2)).join("\n\n"); };

const source = `<slex-card title="Policy-gated request">
  <slex-row><slex-button id="allowed" label="Allowed request"></slex-button><slex-button id="denied" label="Denied request"></slex-button></slex-row>
  <slex-text id="status" text="No request yet"></slex-text>
</slex-card>
<script type="module">
  const status = slex.root.querySelector("#status");
  const allowed = slex.root.querySelector("#allowed"); const denied = slex.root.querySelector("#denied");
  const request = async (url) => { try { const result = await slex.api.fetch(url, { method: "GET" }); status.text = result.status + " " + result.statusText; } catch (error) { status.text = error instanceof Error ? error.message : String(error); } };
  const loadAllowed = () => request("https://api.example.test/status"); const loadDenied = () => request("https://denied.example.test/status");
  allowed.addEventListener("click", loadAllowed); denied.addEventListener("click", loadDenied);
  slex.onDispose(() => { allowed.removeEventListener("click", loadAllowed); denied.removeEventListener("click", loadDenied); });
</script>`;

const handle = mount(source, document.getElementById("app"), {
  secureFrame: { runtimeUrl: "/slexkit.runtime.js", styleUrl: "/dist/slexkit.css" },
  policy: { network: { enabled: true, methods: ["GET"], allowOrigins: ["https://api.example.test"], credentials: "omit", timeoutMs: 3000, maxResponseBytes: 4096 } },
  hostAdapter: {
    async fetch(request) { writeLog({ phase: "host-fetch", url: request.url }); return { ok: true, status: 200, statusText: "OK", url: request.url, headers: { "content-type": "application/json" }, data: { status: "online" }, text: '{"status":"online"}', elapsedMs: 12 }; },
    onNetworkLog(event) { writeLog({ phase: event.phase, url: event.request.url, status: event.result?.status, error: event.error?.message }); },
  },
});
await handle.ready;
