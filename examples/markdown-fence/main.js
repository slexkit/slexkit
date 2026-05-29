import { createSlexKitMarkdownRuntimeHost } from "/dist/slexkit.js";

const artifactId = "example-message-1";
const stateSource = `({
  namespace: "shared_panel",
  g: {
    title: "Artifact-scoped dashboard",
    status: "ready",
    count: 3
  }
})`;

const layoutSource = `({
  namespace: "shared_panel",
  layout: {
    "card:summary": {
      title: "slex fence",
      "grid:stats": {
        columns: 1,
        mdColumns: 3,
        "stat:title": { label: "Title", "$value": "g.title" },
        "stat:status": { label: "Status", "$value": "g.status" },
        "stat:count": { label: "Count", "$value": "g.count" }
      }
    }
  }
})`;

const shorthandSource = `({
  "callout:note": {
    tone: "info",
    title: "slex shorthand",
    "text:body": {
      text: "A render tree can be mounted without a layout wrapper."
    }
  }
})`;

document.getElementById("state-source").textContent = "```slex\n" + stateSource + "\n```";
document.getElementById("layout-source").textContent = "```slex\n" + layoutSource + "\n```";
document.getElementById("shorthand-source").textContent = "```slex\n" + shorthandSource + "\n```";

const host = createSlexKitMarkdownRuntimeHost({
  mode: "trusted",
  theme: "host-shadcn",
});

host.mountBlock({
  artifactId,
  blockId: "state",
  stateOnly: true,
  source: stateSource,
  container: document.getElementById("state-slot"),
});

host.mountBlock({
  artifactId,
  blockId: "layout",
  source: layoutSource,
  container: document.getElementById("layout-slot"),
});

host.mountBlock({
  artifactId,
  blockId: "shorthand",
  source: shorthandSource,
  container: document.getElementById("shorthand-slot"),
});

window.addEventListener("pagehide", () => host.disposeAll());
