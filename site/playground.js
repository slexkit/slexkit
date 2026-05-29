import { mount, registerAll } from "../dist/slexkit.js";
import { registerTooling } from "../dist/tooling.js";
import { initSiteTheme } from "./app/theme.js";
import {
  defaultPlaygroundSource,
  normalizePlaygroundMode,
} from "./playground/playground-utils.js";

registerAll();
registerTooling();
initSiteTheme();

const root = document.getElementById("playgroundRoot");
const errorNode = document.getElementById("playgroundError");
const slexkitLabels = {
  "button.label": "按钮",
  "collapsible.trigger": "展开",
  "select.placeholder": "请选择",
  "submit.ignore": "忽略",
  "submit.submit": "提交",
  "toast.close": "关闭通知",
};

function slexkitMountOptions() {
  return {
    dir: document.documentElement.dir || "auto",
    labels: slexkitLabels,
  };
}

function query() {
  return new URLSearchParams(window.location.search);
}

function sourceUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const url = new URL(raw, window.location.href);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Unsupported source URL");
  }
  return url;
}

function setError(error) {
  if (!errorNode) return;
  const message = error instanceof Error ? error.message : String(error);
  errorNode.textContent = message;
  errorNode.classList.remove("hidden");
}

function clearError() {
  if (!errorNode) return;
  errorNode.textContent = "";
  errorNode.classList.add("hidden");
}

async function loadSource(params) {
  const inline = params.get("source") ?? params.get("srcs") ?? params.get("code");
  if (inline) return inline;

  const src = sourceUrl(params.get("src"));
  if (!src) return defaultPlaygroundSource;

  const response = await fetch(src, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${src.pathname}: ${response.status}`);
  }
  return response.text();
}

function postHeight() {
  const height = Math.ceil(document.documentElement.scrollHeight);
  window.parent?.postMessage({
    type: "slexkit:playground:resize",
    height,
  }, "*");
}

async function boot() {
  if (!root) return;
  clearError();

  try {
    const params = query();
    const source = await loadSource(params);
    const sourceType = params.get("type") ?? params.get("sourceType") ?? "auto-markdown";
    const domain = params.get("domain") ?? `playground_${params.get("src") ? "remote" : "inline"}`;
    const mode = normalizePlaygroundMode(params.get("mode"));
    const embedded = params.get("embed") === "1" || params.get("embedded") === "true";
    const previewMinHeight = params.get("previewMinHeight") ?? params.get("height") ?? (embedded ? "100svh" : "calc(100svh - 2rem)");
    document.body.classList.toggle("slex-playground-embedded-body", embedded);

    root.replaceChildren();
    mount({
      namespace: domain,
      g: {},
      layout: {
        "playground:standalone": {
          class: embedded ? "slex-playground--embedded" : "slex-playground--standalone",
          domain,
          mode,
          previewMinHeight,
          source,
          sourceType,
          themeLabel: "切换主题",
          themeToggle: !embedded,
        },
      },
    }, root, slexkitMountOptions());
    window.requestAnimationFrame(postHeight);
  } catch (error) {
    root?.replaceChildren();
    setError(error);
    window.requestAnimationFrame(postHeight);
  }
}

void boot();
