import { mountSecureArtifact } from "/dist/slexkit.js";

const log = document.getElementById("network-log");
const events = [];

function writeLog(entry) {
  events.unshift(entry);
  log.textContent = events.slice(0, 8).map((item) => JSON.stringify(item, null, 2)).join("\n\n");
}

const policy = {
  network: {
    enabled: true,
    methods: ["GET"],
    allowOrigins: ["https://api.example.test"],
    allowHeaders: ["content-type"],
    allowContentTypes: ["application/json", "text/plain"],
    credentials: "omit",
    timeoutMs: 3000,
    maxBodyBytes: 0,
    maxResponseBytes: 4096,
  },
  timer: { enabled: true, maxTimers: 4, minIntervalMs: 50 },
  animation: { enabled: true },
};

const hostAdapter = {
  async fetch(request) {
    writeLog({ phase: "host-fetch", url: request.url, method: request.method });
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      url: request.url,
      headers: { "content-type": "application/json" },
      data: { service: "example", status: "online" },
      text: JSON.stringify({ service: "example", status: "online" }),
      elapsedMs: 12,
    };
  },
  onNetworkLog(event) {
    writeLog({
      phase: event.phase,
      url: event.request.url,
      status: event.result?.status,
      error: event.error?.message,
    });
  },
};

const source = `({
  namespace: "example_secure_fetch",
  g: {
    allowedStatus: "not requested",
    deniedStatus: "not requested",
    async loadAllowed(api) {
      this.allowedStatus = "loading";
      const result = await api.get("https://api.example.test/status");
      this.allowedStatus = result.status + " " + (result.data?.status || result.statusText);
    },
    async loadDenied(api) {
      this.deniedStatus = "loading";
      try {
        await api.get("https://blocked.example.test/status");
        this.deniedStatus = "unexpected success";
      } catch (error) {
        this.deniedStatus = api.errorMessage(error);
      }
    }
  },
  layout: {
    "card:secure": {
      title: "Secure fetch controls",
      "text:summary": {
        text: "Both buttons execute inside the sandbox. The host receives only policy-checked api.fetch requests."
      },
      "row:actions": {
        "button:allowed": {
          label: "Allowed request",
          onclick: "g.loadAllowed(api)"
        },
        "button:denied": {
          label: "Denied request",
          variant: "secondary",
          onclick: "g.loadDenied(api)"
        }
      },
      "grid:results": {
        columns: 1,
        mdColumns: 2,
        "stat:allowed": {
          label: "Allowed status",
          "$value": "g.allowedStatus"
        },
        "stat:denied": {
          label: "Denied status",
          "$value": "g.deniedStatus",
          tone: "warning"
        }
      }
    }
  }
})`;

mountSecureArtifact(source, document.getElementById("app"), {
  policy,
  hostAdapter,
  theme: "host-shadcn",
  frame: {
    runtimeUrl: "/dist/slexkit.runtime.js",
    title: "SlexKit secure fetch sandbox",
  },
});
