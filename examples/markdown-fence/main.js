import { createSlexKitMarkdownRuntimeHost } from "/dist/slexkit.js";

const artifactId = "example-message-1";
const summarySource = `<slex-card title="Artifact-scoped dashboard">
  <slex-grid columns="3"><slex-stat label="Status" value="Ready"></slex-stat><slex-stat label="Count" value="3"></slex-stat><slex-stat label="Revision" value="1"></slex-stat></slex-grid>
</slex-card>`;
const interactiveSource = `<slex-card title="Independent HTML block">
  <slex-stat id="count" label="Clicks" value="0"></slex-stat><slex-button id="add" label="Add"></slex-button>
</slex-card>
<script type="module">
  const count = slex.root.querySelector("#count"); const add = slex.root.querySelector("#add");
  const click = () => { count.value = Number(count.value) + 1; }; add.addEventListener("click", click);
  slex.onDispose(() => add.removeEventListener("click", click));
</script>`;

document.getElementById("summary-source").textContent = "```slex\n" + summarySource + "\n```";
document.getElementById("interactive-source").textContent = "```slex\n" + interactiveSource + "\n```";
document.getElementById("migration-source").textContent = "Each fence is an HTML document block; there is no state-only or shorthand object form.";

const host = createSlexKitMarkdownRuntimeHost({ secureFrame: { runtimeUrl: "/slexkit.runtime.js", styleUrl: "/dist/slexkit.css" } });
await host.updateArtifact(artifactId, [
  { artifactId, blockId: "summary", source: summarySource, container: document.getElementById("summary-slot") },
  { artifactId, blockId: "interactive", source: interactiveSource, container: document.getElementById("interactive-slot") },
], { phase: "commit" });
document.getElementById("migration-slot").textContent = "Stable block IDs coordinate the artifact update.";
addEventListener("pagehide", () => host.disposeAll(), { once: true });
