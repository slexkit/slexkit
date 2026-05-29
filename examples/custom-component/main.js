import { attachComponentDisposer, disposeNamespace, mount, register } from "/dist/slexkit.js";

const namespace = "example_custom_component";
const app = document.getElementById("app");
const log = document.getElementById("log");
let cleanup;
let logLines = [];

function writeLog(message) {
  logLines.unshift(`${new Date().toLocaleTimeString()} ${message}`);
  log.textContent = logLines.slice(0, 10).join("\n");
}

register("vanilla-counter", (props, name, ctx) => {
  let value = Number(props.value ?? 0);
  const root = document.createElement("div");
  root.className = "example-panel";
  root.style.boxShadow = "none";

  const title = document.createElement("h2");
  title.textContent = `Vanilla counter: ${name}`;

  const readout = document.createElement("p");
  readout.textContent = `Value: ${value}`;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "example-button primary";
  button.textContent = "Increment";
  button.addEventListener("click", () => {
    value += 1;
    readout.textContent = `Value: ${value}`;
    ctx.emit("change", value);
  });

  const timer = setInterval(() => {
    root.dataset.tick = String(Date.now());
  }, 1000);

  attachComponentDisposer(root, () => {
    clearInterval(timer);
    writeLog("vanilla-counter disposer ran");
  });

  root.append(title, readout, button);
  writeLog("vanilla-counter mounted");
  return root;
}, { state: "value" });

function mountExample() {
  cleanup?.();
  app.textContent = "";
  cleanup = mount({
    namespace,
    g: {
      count: 2,
    },
    layout: {
      "card:demo": {
        title: "Custom component bridge",
        "vanilla-counter:counter": {
          $value: "g.count",
          onchange: "g.count = $event",
        },
        "stat:count": {
          label: "Namespace count",
          $value: "g.count",
        },
      },
    },
  }, app, { theme: "host-shadcn" });
}

document.getElementById("dispose").addEventListener("click", () => {
  disposeNamespace(namespace);
  writeLog("disposeNamespace called");
});

document.getElementById("remount").addEventListener("click", mountExample);

mountExample();
