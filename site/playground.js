import { html } from "@codemirror/lang-html";
import { markdown } from "@codemirror/lang-markdown";
import { defaultKeymap, historyKeymap } from "@codemirror/commands";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { mount, unmount } from "svelte";
import {
  createSlexKitMarkdownRuntimeHost,
  inspectSlexSource,
} from "../dist/slexkit.js";
import { applySiteTheme, initSiteTheme } from "./app/theme.js";
import PlaygroundMarkdown from "./markdown/PlaygroundMarkdown.svelte";
import { defaultPlaygroundSource, normalizePlaygroundMode } from "./playground/playground-utils.js";

initSiteTheme();

const root = document.getElementById("playgroundRoot");
const errorNode = document.getElementById("playgroundError");
const params = new URLSearchParams(location.search);
const embedded = params.get("embed") === "1" || params.get("embedded") === "true";
if (embedded) {
  document.documentElement.dataset.playgroundEmbed = "true";
  document.body.dataset.playgroundEmbed = "true";
}

const runtimeUrl = new URL("../slexkit.runtime.js", import.meta.url).href;
const sourceType = (params.get("type") ?? params.get("sourceType") ?? "markdown").toLowerCase();
const artifactId = params.get("domain") ?? "site-playground";
let activeMode = normalizePlaygroundMode(params.get("mode"));
let editor;
let runtimeHost;
let markdownApp;
let updateTimer = 0;
let resizeObserver;
const heightTimers = [];

const icons = {
  preview: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
  live: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 5v14"/></svg>',
  code: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>',
  popout: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></svg>',
  theme: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5a8.5 8.5 0 1 0 12 12Z"/></svg>',
};

function sourceUrl(value) {
  if (!value) return null;
  const url = new URL(value, location.href);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only HTTP(S) source URLs are supported.");
  return url;
}

async function loadSource() {
  const inline = params.get("source") ?? params.get("code");
  if (inline) return inline;
  const url = sourceUrl(params.get("src"));
  if (!url) return defaultPlaygroundSource;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load ${url.pathname}: ${response.status}`);
  return response.text();
}

function markdownBlocks(source) {
  return Array.from(source.matchAll(/(```|~~~)slex(?:[ \t]+[^\n]*)?\n([\s\S]*?)\n\1/g), (match, index) => ({
    id: `block-${index + 1}`,
    source: match[2],
  }));
}

function inspectSource(source) {
  const markdownSource = sourceType === "markdown" || sourceType === "auto-markdown";
  const blocks = markdownSource ? markdownBlocks(source) : [{ id: "block-1", source }];
  if (markdownSource) {
    const openers = Array.from(source.matchAll(/^(?:```|~~~)slex(?:[ \t]+[^\n]*)?$/gm)).length;
    if (openers !== blocks.length) return { ok: false, blocks, message: "Close the slex fence to update the preview." };
  }
  for (const block of blocks) {
    const result = inspectSlexSource(block.source);
    if (!result.ok) return { ok: false, blocks, message: result.error?.message ?? result.diagnostic?.message ?? "Invalid HTML" };
  }
  return { ok: true, blocks };
}

function previewMarkdown(source) {
  if (sourceType === "markdown" || sourceType === "auto-markdown") return source;
  return `~~~slex\n${source}\n~~~`;
}

function setError(error) {
  if (!errorNode) return;
  errorNode.textContent = error ? (error instanceof Error ? error.message : String(error)) : "";
  errorNode.classList.toggle("hidden", !error);
}

function postHeight() {
  const shellHeight = root?.firstElementChild?.getBoundingClientRect().height ?? 0;
  const errorHeight = errorNode && !errorNode.classList.contains("hidden") ? errorNode.getBoundingClientRect().height : 0;
  const height = Math.ceil(Math.max(document.documentElement.scrollHeight, root?.scrollHeight ?? 0, shellHeight + errorHeight));
  parent?.postMessage({ type: "slexkit:playground:resize", height }, location.origin);
}

function iconButton(name, label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "slex-preview-icon-button";
  button.dataset.action = name;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.innerHTML = icons[name];
  button.addEventListener("click", onClick);
  return button;
}

function setMode(mode, shell, editorPane, previewPane, modeButtons) {
  activeMode = normalizePlaygroundMode(mode);
  shell.dataset.mode = activeMode;
  shell.className = `slex-playground slex-playground--${activeMode}`;
  editorPane.hidden = activeMode === "render";
  previewPane.hidden = activeMode === "code";
  for (const [name, button] of Object.entries(modeButtons)) {
    const pressed = name === activeMode;
    button.setAttribute("aria-pressed", String(pressed));
    button.classList.toggle("is-active", pressed);
  }
  requestAnimationFrame(postHeight);
}

async function copySource(button) {
  const value = editor?.state.doc.toString() ?? "";
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const field = document.createElement("textarea");
    field.value = value;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  }
  button.dataset.copied = "true";
  button.setAttribute("aria-label", "Copied");
  setTimeout(() => {
    button.dataset.copied = "false";
    button.setAttribute("aria-label", "Copy source");
  }, 1200);
}

function openPopout() {
  const url = new URL(location.href);
  url.searchParams.delete("embed");
  url.searchParams.delete("embedded");
  url.searchParams.delete("src");
  url.searchParams.set("source", editor?.state.doc.toString() ?? "");
  url.searchParams.set("type", sourceType);
  url.searchParams.set("mode", activeMode);
  window.open(url, "_blank", "noopener,noreferrer");
}

function toggleTheme(button) {
  const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
  applySiteTheme(next, { persist: true });
  button.setAttribute("aria-pressed", String(next === "dark"));
}

function createLayout(source) {
  const shell = document.createElement("section");
  shell.className = "slex-playground";
  shell.dataset.sourceType = sourceType;

  const toolbar = document.createElement("div");
  toolbar.className = "slex-preview-toolbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Preview controls");

  const modes = document.createElement("div");
  modes.className = "slex-preview-modes";
  const editorPane = document.createElement("div");
  editorPane.className = "slex-playground-editor";
  const previewPane = document.createElement("div");
  previewPane.className = "slex-playground-preview slex-preview-canvas";
  previewPane.dataset.playgroundPreview = "true";
  const workspace = document.createElement("div");
  workspace.className = "slex-playground-workspace";
  workspace.append(editorPane, previewPane);

  const modeButtons = {};
  const modesConfig = [
    ["render", "preview", "Preview"],
    ["live", "live", "Live editor and preview"],
    ["code", "code", "Code editor"],
  ];
  for (const [modeName, iconName, label] of modesConfig) {
    modeButtons[modeName] = iconButton(iconName, label, () => setMode(modeName, shell, editorPane, previewPane, modeButtons));
    modeButtons[modeName].dataset.mode = modeName;
    modes.append(modeButtons[modeName]);
  }

  const format = document.createElement("span");
  format.className = "slex-preview-format";
  format.textContent = sourceType === "markdown" || sourceType === "auto-markdown" ? "Markdown" : "HTML";

  const status = document.createElement("span");
  status.className = "slex-preview-status";
  status.dataset.playgroundStatus = "true";
  status.setAttribute("aria-live", "polite");

  const actions = document.createElement("div");
  actions.className = "slex-preview-actions";
  const themeButton = iconButton("theme", "Toggle color theme", () => toggleTheme(themeButton));
  themeButton.setAttribute("aria-pressed", String(document.documentElement.classList.contains("dark")));
  const copyButton = iconButton("copy", "Copy source", () => void copySource(copyButton));
  const popoutButton = iconButton("popout", "Open in new window", openPopout);
  if (!embedded) actions.append(themeButton);
  actions.append(popoutButton, copyButton);
  toolbar.append(modes, format, status, actions);
  shell.append(toolbar, workspace);
  root.replaceChildren(shell);

  editor = new EditorView({
    parent: editorPane,
    state: EditorState.create({
      doc: source,
      extensions: [
        keymap.of([...defaultKeymap, ...historyKeymap]),
        sourceType === "slex" || sourceType === "html" ? html() : markdown(),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          clearTimeout(updateTimer);
          updateTimer = setTimeout(() => renderSource(update.state.doc.toString(), status), 90);
        }),
      ],
    }),
  });

  setMode(activeMode, shell, editorPane, previewPane, modeButtons);
  return { previewPane, status };
}

function renderSource(source, status) {
  const result = inspectSource(source);
  status.textContent = result.ok
    ? `${result.blocks.length} HTML block${result.blocks.length === 1 ? "" : "s"}`
    : "Preview retained · fix HTML";
  if (!result.ok) {
    setError(result.message);
    postHeight();
    return false;
  }

  setError(null);
  markdownApp?.updateSource(previewMarkdown(source));
  requestAnimationFrame(postHeight);
  return true;
}

async function boot() {
  if (!root) return;
  const source = await loadSource();
  runtimeHost = createSlexKitMarkdownRuntimeHost({
    secureFrame: {
      runtimeUrl,
      styleUrl: new URL("../slexkit.css", import.meta.url).href,
      fontUrls: [new URL("../fonts/", import.meta.url).href],
    },
  });
  const { previewPane, status } = createLayout(source);
  markdownApp = mount(PlaygroundMarkdown, {
    target: previewPane,
    props: {
      source: previewMarkdown(source),
      domain: artifactId,
      runtimeHost,
      secureFrame: {
        runtimeUrl,
        styleUrl: new URL("../slexkit.css", import.meta.url).href,
        fontUrls: [new URL("../fonts/", import.meta.url).href],
      },
    },
  });
  renderSource(source, status);
  resizeObserver = new ResizeObserver(postHeight);
  resizeObserver.observe(root);
  if (root.firstElementChild) resizeObserver.observe(root.firstElementChild);
  resizeObserver.observe(previewPane);
  for (const delay of [100, 350, 800, 1600, 3200]) heightTimers.push(setTimeout(postHeight, delay));
}

boot().catch(setError);
addEventListener("beforeunload", () => {
  clearTimeout(updateTimer);
  for (const timer of heightTimers) clearTimeout(timer);
  resizeObserver?.disconnect();
  editor?.destroy();
  if (markdownApp) void unmount(markdownApp);
  runtimeHost?.disposeAll();
});
