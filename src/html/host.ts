import { createSecureRuntime, type NetworkOptions } from "../engine/secure-runtime";
import { TRANSFER_THEME_TOKENS } from "../engine/theme";
import { COMPONENT_BASE_STYLE_HASH } from "../web-components/base-style";
import { inspectSlexSource, SlexKitRuntimeError } from "./inspect";
import {
  HTML_CHANNEL,
  cloneJsonValue,
  isJsonValue,
  isRunnerMessage,
  serializedError,
  type HtmlFrameCommand,
  type HtmlRunnerMessage,
  type HtmlThemeState,
} from "./protocol";
import type {
  HtmlMountHandle,
  HtmlMountOptions,
  HtmlSecureFrameOptions,
  SlexKitMarkdownBlock,
  SlexKitMarkdownRuntimeHost,
  SlexKitMarkdownRuntimeOptions,
} from "./types";

const BOOTSTRAP_SCRIPT =
  'const expectedNonce=document.querySelector("script[nonce]").nonce;addEventListener("message",async function boot(event){const data=event.data;if(!event.source||!data||data.kind!=="slexkit-bootstrap-init"||data.bootstrapNonce!==expectedNonce||typeof data.runtimeUrl!=="string"||typeof data.token!=="string"||data.token.length<16||!Number.isSafeInteger(data.options?.epoch)||data.options.epoch<1)return;removeEventListener("message",boot);const host=event.source;try{const runtime=await import(data.runtimeUrl);if(typeof runtime.startSlexKitSandboxRunner!=="function")throw new Error("Runtime does not export startSlexKitSandboxRunner.");runtime.startSlexKitSandboxRunner({...data.options,hostWindow:host})}catch(error){try{host.postMessage({channel:"slexkit-html-v1",token:data.token,epoch:data.options.epoch,kind:"error",requestId:"bootstrap",revision:0,error:{name:error?.name||"Error",message:error?.message||String(error)}},"*")}catch{}}})';
const BASE_STYLE =
  'html,body{margin:0;min-height:0}body{overflow:hidden;font-family:var(--font-sans,"Geist","Geist Sans","Noto Sans SC",ui-sans-serif,system-ui,sans-serif);font-size:14px;line-height:1.5;color:var(--foreground,CanvasText)}#slex-root{display:flow-root}button,input,select,textarea{font:inherit}';
const THEME_TOKEN_LIMIT = 512;

type Pending = {
  revision: number;
  resolve(value: unknown): void;
  reject(error: Error): void;
  timer: ReturnType<typeof setTimeout>;
};
type SharedContext = { values: Record<string, unknown>; frames: Set<FrameController> };
type ArtifactState = { context: SharedContext; tail: Promise<void>; epoch: number };

let configuredRuntimeUrl = import.meta.url || "";

export function setSlexKitRuntimeUrl(url: string): void {
  if (typeof url !== "string" || !url.trim())
    throw new TypeError("SlexKit runtime URL must be a non-empty string.");
  configuredRuntimeUrl = url.trim();
}
export function getSlexKitRuntimeUrl(): string {
  return configuredRuntimeUrl;
}

function randomToken(): string {
  const bytes = new Uint8Array(24);
  if (!globalThis.crypto?.getRandomValues)
    throw new SlexKitRuntimeError("Secure random values are required to create a SlexKit frame.");
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}
function htmlAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
function cspSource(url: string): string {
  const parsed = new URL(url);
  parsed.hash = "";
  if (parsed.protocol === "blob:" || parsed.protocol === "data:") return parsed.protocol;
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SlexKitRuntimeError(`Unsupported sandbox asset protocol: ${parsed.protocol}`);
  }
  return parsed.href.replace(/[\s;'"<>]/g, (character) => encodeURIComponent(character));
}
function uniqueSources(values: readonly string[]): string[] {
  return [...new Set(values.map(cspSource))];
}

function restrictiveDirectives(options: {
  styleUrl?: string;
  fontUrls?: readonly string[];
  imageUrls?: readonly string[];
}): string[] {
  const styles = options.styleUrl ? uniqueSources([options.styleUrl]) : [];
  const fonts = uniqueSources(options.fontUrls ?? []);
  const images = uniqueSources(options.imageUrls ?? []);
  return [
    `style-src-elem blob: data: ${COMPONENT_BASE_STYLE_HASH}${styles.length ? ` ${styles.join(" ")}` : ""}`,
    "style-src-attr 'unsafe-inline'",
    `img-src${images.length ? ` ${images.join(" ")}` : " 'none'"}`,
    `font-src${fonts.length ? ` ${fonts.join(" ")}` : " 'none'"}`,
    "connect-src 'none'",
    "frame-src 'none'",
    "child-src 'none'",
    "worker-src 'none'",
    "media-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "manifest-src 'none'",
  ];
}

export function createLockedRuntimePolicy(
  options: {
    styleUrl?: string;
    fontUrls?: readonly string[];
    imageUrls?: readonly string[];
  } = {},
): string {
  return ["default-src 'none'", "script-src blob:", ...restrictiveDirectives(options)].join("; ");
}

export function createBootstrapDocument(options: {
  runtimeUrl: string;
  styleUrl?: string;
  fontUrls?: readonly string[];
  imageUrls?: readonly string[];
  nonce: string;
}): string {
  if (!/^[A-Za-z0-9+/_-]{16,128}$/.test(options.nonce))
    throw new TypeError("A valid CSP nonce is required.");
  const runtime = cspSource(options.runtimeUrl);
  const nonce = htmlAttribute(options.nonce);
  const policy = [
    "default-src 'none'",
    `script-src 'nonce-${nonce}' blob: ${runtime}`,
    ...restrictiveDirectives(options).map((directive) =>
      directive.startsWith("style-src-elem ")
        ? directive.replace("style-src-elem ", `style-src-elem 'nonce-${nonce}' `)
        : directive,
    ),
  ].join("; ");
  const stylesheetPreload = options.styleUrl && !options.styleUrl.startsWith("data:")
    ? `<link rel="preload" as="style" crossorigin="anonymous" href="${htmlAttribute(options.styleUrl)}">`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="${htmlAttribute(policy)}">${stylesheetPreload}<style nonce="${nonce}">${BASE_STYLE}</style></head><body><script type="module" nonce="${nonce}">${BOOTSTRAP_SCRIPT}</script></body></html>`;
}

function resultError(value: { name: string; message: string } | undefined): Error {
  return Object.assign(new Error(value?.message ?? "Sandbox request failed."), {
    name: value?.name ?? "Error",
  });
}
function boundedTimeout(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? Math.min(300_000, Math.max(1, value!)) : fallback;
}

function explicitThemeMode(
  document: Document,
  container: HTMLElement,
  requested: string | undefined,
): "light" | "dark" {
  if (requested === "dark" || requested === "light") return requested;
  const marker =
    container.closest(
      '.dark, .light, .theme-dark, .theme-light, [data-theme="dark"], [data-theme="light"]',
    ) ?? document.documentElement;
  if (
    marker.classList.contains("dark") ||
    marker.classList.contains("theme-dark") ||
    marker.getAttribute("data-theme") === "dark"
  )
    return "dark";
  if (
    marker.classList.contains("light") ||
    marker.classList.contains("theme-light") ||
    marker.getAttribute("data-theme") === "light"
  )
    return "light";
  return document.defaultView?.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
function readTheme(
  document: Document,
  container: HTMLElement,
  requested: string | undefined,
): HtmlThemeState {
  const owner = document.defaultView;
  const tokens: Record<string, string> = {};
  if (owner) {
    const computed = owner.getComputedStyle(container);
    // Large document hosts expose hundreds of unrelated custom properties.
    // Transfer the documented palette and sizing contract before filling the
    // bounded extension budget, regardless of computed-style enumeration order.
    for (const name of TRANSFER_THEME_TOKENS) {
      const value = computed.getPropertyValue(name).trim();
      if (value && value.length <= 4096) tokens[name] = value;
    }
    for (
      let index = 0;
      index < computed.length && Object.keys(tokens).length < THEME_TOKEN_LIMIT;
      index++
    ) {
      const name = computed.item(index);
      if (!name.startsWith("--") || name.length > 130) continue;
      const value = computed.getPropertyValue(name).trim();
      if (value.length <= 4096) tokens[name] = value;
    }
  }
  return {
    mode: explicitThemeMode(document, container, requested),
    ...(requested ? { name: requested } : {}),
    tokens,
  };
}

class FrameController {
  readonly iframe: HTMLIFrameElement;
  readonly ready: Promise<void>;
  readonly artifactId: string;
  readonly blockId: string;
  private readonly authToken = randomToken();
  private readonly cspNonce = randomToken();
  private readonly pending = new Map<string, Pending>();
  private readonly policyRuntime;
  private readonly ownerWindow: Window;
  private readonly messageWindow: Window;
  private readonly ownerDocument: Document;
  private readonly loadListener: () => void;
  private readonly themeObserver: MutationObserver;
  private readonly themeMedia?: MediaQueryList;
  private readonly themeListener: () => void;
  private revision = 0;
  private requestSequence = 0;
  private disposed = false;
  private disposing = false;
  private source = "";
  private mutationTail = Promise.resolve();
  private resolveReady!: () => void;
  private rejectReady!: (error: Error) => void;
  private readySettled = false;
  private epoch = 0;
  private hasLoaded = false;
  private runnerReady!: Promise<void>;
  private resolveRunnerReady!: () => void;
  private rejectRunnerReady!: (error: Error) => void;
  private runnerReadyTimer?: ReturnType<typeof setTimeout>;
  private sourceId = "";
  private cachedState?: unknown;
  private cachedStateRevision = -1;
  private cachedStateSourceId = "";
  private initialRestore?: unknown;

  constructor(
    private block: SlexKitMarkdownBlock,
    private readonly options: SlexKitMarkdownRuntimeOptions,
    private readonly shared: SharedContext,
    restoreState?: unknown,
  ) {
    this.artifactId = block.artifactId ?? `isolated:${this.authToken}`;
    this.blockId = block.blockId ?? `block:${this.authToken}`;
    this.ownerDocument = block.container.ownerDocument;
    const ownerWindow = this.ownerDocument.defaultView;
    if (!ownerWindow) throw new SlexKitRuntimeError("SlexKit requires a live browser window.");
    this.ownerWindow = ownerWindow;
    this.messageWindow = typeof window !== "undefined" ? window : ownerWindow;
    this.initialRestore = restoreState === undefined ? undefined : cloneJsonValue(restoreState);
    this.resetRunnerReady();
    const runtimeUrl = this.runtimeUrl();
    const styleUrl = this.styleUrl();
    this.iframe = this.ownerDocument.createElement("iframe");
    this.iframe.className = this.frameOptions().className ?? "slexkit-html-frame";
    this.iframe.title = this.frameOptions().title ?? "Interactive SlexKit content";
    this.iframe.setAttribute("sandbox", "allow-scripts");
    this.iframe.setAttribute("referrerpolicy", "no-referrer");
    Object.assign(this.iframe.style, { width: "100%", border: "0", display: "block" });
    const fontUrls = (this.frameOptions().fontUrls ?? options.fontUrls ?? []).map((value) =>
      this.resolveAsset(value, "font"),
    );
    const imageUrls = (this.frameOptions().imageUrls ?? options.imageUrls ?? []).map((value) =>
      this.resolveAsset(value, "image"),
    );
    const approvedAssets = { ...(styleUrl ? { styleUrl } : {}), fontUrls, imageUrls };
    this.iframe.srcdoc = createBootstrapDocument({
      runtimeUrl,
      ...approvedAssets,
      nonce: this.cspNonce,
    });
    this.ready = new Promise<void>((resolve, reject) => {
      this.resolveReady = () => {
        if (!this.readySettled) {
          this.readySettled = true;
          resolve();
        }
      };
      this.rejectReady = (error) => {
        if (!this.readySettled) {
          this.readySettled = true;
          reject(error);
        }
      };
    });
    this.policyRuntime = createSecureRuntime(options.policy ?? {}, options.hostAdapter);
    this.messageWindow.addEventListener("message", this.onMessage);
    this.loadListener = () => {
      if (this.disposed || this.disposing) return;
      if (this.hasLoaded) {
        this.rejectPending(new SlexKitRuntimeError("SlexKit sandbox browsing context reloaded."));
        this.resetRunnerReady();
      }
      this.hasLoaded = true;
      this.epoch++;
      const loadedEpoch = this.epoch;
      clearTimeout(this.runnerReadyTimer);
      this.runnerReadyTimer = setTimeout(() => {
        if (loadedEpoch !== this.epoch || this.disposed || this.disposing) return;
        const error = new SlexKitRuntimeError(
          "SlexKit sandbox runtime did not become ready after navigation.",
        );
        this.rejectRunnerReady(error);
        this.rejectReady(error);
      }, this.loadTimeout());
      this.safePostRaw({
        kind: "slexkit-bootstrap-init",
        bootstrapNonce: this.cspNonce,
        runtimeUrl,
        token: this.authToken,
        epoch: this.epoch,
        options: {
          token: this.authToken,
          epoch: this.epoch,
          lockedCsp: createLockedRuntimePolicy(approvedAssets),
          policy: options.policy ?? {},
          styleUrl,
          theme: this.themeState(),
          dir: block.dir ?? options.dir,
          shared: cloneJsonValue(shared.values),
        },
      });
    };
    this.iframe.addEventListener("load", this.loadListener);
    this.themeListener = () => this.sendTheme();
    this.themeObserver = new ownerWindow.MutationObserver(this.themeListener);
    const themeObservation: MutationObserverInit = {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    };
    this.themeObserver.observe(this.ownerDocument.documentElement, themeObservation);
    for (
      let element: HTMLElement | null = block.container;
      element && element !== this.ownerDocument.documentElement;
      element = element.parentElement
    ) {
      this.themeObserver.observe(element, themeObservation);
    }
    this.themeMedia = ownerWindow.matchMedia?.("(prefers-color-scheme: dark)");
    this.themeMedia?.addEventListener?.("change", this.themeListener);
    block.container.replaceChildren(this.iframe);
    shared.frames.add(this);
    const timeout = setTimeout(
      () => {
        const error = new SlexKitRuntimeError("SlexKit sandbox runtime did not become ready.");
        this.rejectRunnerReady(error);
        this.rejectReady(error);
      },
      this.loadTimeout(),
    );
    this.ready.then(
      () => clearTimeout(timeout),
      () => clearTimeout(timeout),
    );
  }

  private frameOptions(): HtmlSecureFrameOptions {
    return typeof this.options.secureFrame === "object" ? this.options.secureFrame : {};
  }
  private resetRunnerReady(): void {
    const wakePrevious = this.resolveRunnerReady;
    this.runnerReady = new Promise<void>((resolve, reject) => {
      this.resolveRunnerReady = resolve;
      this.rejectRunnerReady = reject;
    });
    void this.runnerReady.catch(() => {});
    wakePrevious?.();
  }
  private async waitForRunner(): Promise<void> {
    while (true) {
      const current = this.runnerReady;
      await current;
      if (current === this.runnerReady) return;
    }
  }
  private rejectPending(error: Error): void {
    for (const [requestId, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(error);
      this.pending.delete(requestId);
    }
  }
  private resolveAsset(value: string, name: string): string {
    try {
      const resolved = new URL(value, this.ownerDocument.baseURI);
      cspSource(resolved.href);
      return resolved.href;
    } catch {
      throw new SlexKitRuntimeError(`SlexKit ${name} URL is invalid; refusing to mount HTML.`);
    }
  }
  private runtimeUrl(): string {
    const value = this.frameOptions().runtimeUrl ?? this.options.runtimeUrl ?? configuredRuntimeUrl;
    if (!value)
      throw new SlexKitRuntimeError("SlexKit runtime URL is unavailable; refusing to mount HTML.");
    return this.resolveAsset(value, "runtime");
  }
  private styleUrl(): string | false | undefined {
    const value = this.frameOptions().styleUrl ?? this.options.styleUrl;
    if (value === false) return false;
    return this.resolveAsset(value ?? new URL("./slexkit.css", this.runtimeUrl()).href, "style");
  }
  private loadTimeout(): number {
    return boundedTimeout(this.frameOptions().loadTimeoutMs ?? this.options.loadTimeoutMs, 10_000);
  }
  private teardownTimeout(): number {
    return boundedTimeout(this.frameOptions().teardownTimeoutMs, 250);
  }
  private themeState(): HtmlThemeState {
    return readTheme(
      this.ownerDocument,
      this.block.container,
      this.block.theme ?? this.options.theme,
    );
  }
  private safePostRaw(message: unknown): boolean {
    if (!this.iframe.contentWindow) return false;
    try {
      this.iframe.contentWindow.postMessage(message, "*");
      return true;
    } catch {
      return false;
    }
  }
  private post(message: HtmlFrameCommand): void {
    if (this.disposed || !this.safePostRaw(message))
      throw new SlexKitRuntimeError("SlexKit sandbox frame is unavailable.");
  }
  private request(
    kind: "commit" | "reset" | "snapshot",
    revision: number,
    fields: Record<string, unknown> = {},
  ): Promise<unknown> {
    if (this.disposing || this.disposed)
      return Promise.reject(new SlexKitRuntimeError("SlexKit frame is disposing."));
    const requestId = `${this.blockId}:${++this.requestSequence}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new SlexKitRuntimeError(`SlexKit sandbox ${kind} request timed out.`));
      }, this.loadTimeout());
      this.pending.set(requestId, { revision, resolve, reject, timer });
      try {
        this.post({
          channel: HTML_CHANNEL,
          token: this.authToken,
          epoch: this.epoch,
          kind,
          requestId,
          revision,
          ...fields,
        } as HtmlFrameCommand);
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(requestId);
        reject(error as Error);
      }
    });
  }
  private sendTheme(): void {
    if (this.disposed || this.disposing || !this.readySettled) return;
    try {
      this.post({
        channel: HTML_CHANNEL,
        token: this.authToken,
        epoch: this.epoch,
        kind: "theme",
        requestId: `theme:${++this.requestSequence}`,
        revision: this.revision,
        theme: this.themeState(),
        dir: this.block.dir ?? this.options.dir,
      });
    } catch {
      /* Teardown wins. */
    }
  }
  private onMessage = (event: MessageEvent): void => {
    if (
      this.disposed ||
      event.source !== this.iframe.contentWindow ||
      !isRunnerMessage(event.data, this.authToken, this.epoch)
    )
      return;
    const message = event.data;
    if (message.kind === "ready") {
      clearTimeout(this.runnerReadyTimer);
      this.resolveRunnerReady();
      this.resolveReady();
      this.sendTheme();
      if (this.source) this.recoverAfterReload();
      return;
    }
    const activeRevision =
      message.revision === this.revision ||
      Array.from(this.pending.values()).some((pending) => pending.revision === message.revision);
    if (message.kind === "height") {
      if (!this.disposing && activeRevision)
        this.iframe.style.height = `${Math.ceil(message.height)}px`;
      return;
    }
    if (message.kind === "state") {
      if (
        this.disposing ||
        message.revision !== this.revision ||
        message.sourceId !== this.sourceId
      )
        return;
      this.cachedState = cloneJsonValue(message.state);
      this.cachedStateRevision = message.revision;
      this.cachedStateSourceId = message.sourceId;
      return;
    }
    if (message.kind === "shared-set") {
      if (this.disposing || !activeRevision) return;
      const value = cloneJsonValue(message.value);
      this.shared.values[message.key] = value;
      for (const frame of this.shared.frames) frame.sendShared({ [message.key]: value });
      return;
    }
    if (message.kind === "api-fetch") {
      if (!this.disposing && activeRevision) void this.handleFetch(message).catch(() => {});
      return;
    }
    if (message.kind === "error" && message.requestId === "bootstrap") {
      this.rejectReady(resultError(message.error));
      return;
    }
    const pending = this.pending.get(message.requestId);
    if (!pending || pending.revision !== message.revision) return;
    this.pending.delete(message.requestId);
    clearTimeout(pending.timer);
    if (message.kind === "result" && message.ok) pending.resolve(message.result);
    else pending.reject(resultError(message.kind === "result" ? message.error : undefined));
  };
  private async handleFetch(
    message: Extract<HtmlRunnerMessage, { kind: "api-fetch" }>,
  ): Promise<void> {
    const responseRevision = message.revision;
    try {
      const result = await this.policyRuntime.api.fetch(
        message.url,
        message.options as NetworkOptions,
      );
      if (this.disposed || this.disposing) return;
      this.safePostRaw({
        channel: HTML_CHANNEL,
        token: this.authToken,
        epoch: this.epoch,
        kind: "api-result",
        requestId: message.requestId,
        revision: responseRevision,
        result,
      } satisfies HtmlFrameCommand);
    } catch (error) {
      if (this.disposed || this.disposing) return;
      this.safePostRaw({
        channel: HTML_CHANNEL,
        token: this.authToken,
        epoch: this.epoch,
        kind: "api-result",
        requestId: message.requestId,
        revision: responseRevision,
        error: serializedError(error),
      } satisfies HtmlFrameCommand);
    }
  }
  sendShared(values: Record<string, unknown>): void {
    if (this.disposed || this.disposing) return;
    try {
      this.post({
        channel: HTML_CHANNEL,
        token: this.authToken,
        epoch: this.epoch,
        kind: "shared-state",
        requestId: `shared:${++this.requestSequence}`,
        revision: this.revision,
        shared: cloneJsonValue(values),
      });
    } catch {
      /* Teardown wins. */
    }
  }
  commit(nextSource: string, reset = false): Promise<void> {
    const inspected = inspectSlexSource(nextSource);
    if (!inspected.ok) return Promise.reject(inspected.error);
    const task = this.mutationTail.then(async () => {
      await this.waitForRunner();
      if (this.disposed || this.disposing)
        throw new SlexKitRuntimeError("SlexKit frame was disposed.");
      const nextRevision = this.revision + 1;
      const previousSourceId = this.sourceId;
      const nextSourceId = randomToken();
      if (reset) this.clearCachedState();
      this.sourceId = nextSourceId;
      const request = this.request("commit", nextRevision, {
        source: nextSource,
        sourceId: nextSourceId,
        ...(!reset && this.initialRestore !== undefined ? { restore: this.initialRestore } : {}),
        reset,
        theme: this.themeState(),
        dir: this.block.dir ?? this.options.dir,
      });
      // The runner consumes a revision even when its transaction rolls back.
      this.revision = nextRevision;
      try {
        await request;
      } catch (error) {
        this.sourceId = previousSourceId;
        throw error;
      }
      this.source = nextSource;
      this.initialRestore = undefined;
    });
    this.mutationTail = task.catch(() => {});
    return task;
  }
  updateBlock(block: SlexKitMarkdownBlock): void {
    this.block = block;
  }
  reset(): Promise<void> {
    const task = this.mutationTail.then(async () => {
      await this.waitForRunner();
      if (this.disposed || this.disposing)
        throw new SlexKitRuntimeError("SlexKit frame was disposed.");
      const nextRevision = this.revision + 1;
      this.clearCachedState();
      const request = this.request("reset", nextRevision);
      this.revision = nextRevision;
      await request;
    });
    this.mutationTail = task.catch(() => {});
    return task;
  }
  async snapshot(): Promise<unknown> {
    await this.mutationTail;
    await this.waitForRunner();
    return this.request("snapshot", this.revision);
  }
  relocationState(): unknown | undefined {
    return this.cachedStateRevision === this.revision && this.cachedStateSourceId === this.sourceId
      ? cloneJsonValue(this.cachedState)
      : undefined;
  }
  private clearCachedState(): void {
    this.cachedState = undefined;
    this.cachedStateRevision = -1;
    this.cachedStateSourceId = "";
  }
  private recoverAfterReload(): void {
    const restore = this.relocationState();
    const task = this.mutationTail.then(async () => {
      if (this.disposed || this.disposing || !this.source) return;
      await this.waitForRunner();
      await this.request("commit", this.revision, {
        source: this.source,
        sourceId: this.sourceId,
        ...(restore === undefined ? {} : { restore }),
        reset: false,
        theme: this.themeState(),
        dir: this.block.dir ?? this.options.dir,
      });
    });
    this.mutationTail = task.catch(() => {});
  }
  currentSource(): string {
    return this.source;
  }
  dispose(): void {
    if (this.disposed || this.disposing) return;
    this.disposing = true;
    this.policyRuntime.dispose();
    this.shared.frames.delete(this);
    this.themeObserver.disconnect();
    this.themeMedia?.removeEventListener?.("change", this.themeListener);
    this.rejectReady(new SlexKitRuntimeError("SlexKit frame was disposed before becoming ready."));
    this.rejectRunnerReady(
      new SlexKitRuntimeError("SlexKit frame was disposed before becoming ready."),
    );
    clearTimeout(this.runnerReadyTimer);
    this.rejectPending(new SlexKitRuntimeError("SlexKit frame was disposed."));
    const requestId = `dispose:${++this.requestSequence}`;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      this.disposed = true;
      this.pending.delete(requestId);
      this.messageWindow.removeEventListener("message", this.onMessage);
      this.iframe.removeEventListener("load", this.loadListener);
      this.iframe.remove();
    };
    const timer = setTimeout(finish, this.teardownTimeout());
    this.pending.set(requestId, {
      revision: this.revision,
      resolve: () => {
        clearTimeout(timer);
        finish();
      },
      reject: () => {
        clearTimeout(timer);
        finish();
      },
      timer,
    });
    if (
      !this.safePostRaw({
        channel: HTML_CHANNEL,
        token: this.authToken,
        epoch: this.epoch,
        kind: "dispose",
        requestId,
        revision: this.revision,
      } satisfies HtmlFrameCommand)
    ) {
      clearTimeout(timer);
      this.pending.delete(requestId);
      finish();
    }
  }
}

export function createSlexKitMarkdownRuntimeHost(
  initial: SlexKitMarkdownRuntimeOptions = {},
): SlexKitMarkdownRuntimeHost {
  let options = { ...initial };
  const frames = new Map<HTMLElement, FrameController>();
  const artifacts = new Map<string, ArtifactState>();
  const initialShared = (): Record<string, unknown> => {
    const value = options.shared ?? {};
    if (!isJsonValue(value))
      throw new TypeError(
        "Initial shared state must contain bounded getter-free JSON values only.",
      );
    return cloneJsonValue(value);
  };
  const stateFor = (artifactId: string): ArtifactState => {
    let state = artifacts.get(artifactId);
    if (!state) {
      state = {
        context: { values: initialShared(), frames: new Set() },
        tail: Promise.resolve(),
        epoch: 0,
      };
      artifacts.set(artifactId, state);
    }
    return state;
  };
  const contextFor = (artifactId: string | undefined): SharedContext =>
    artifactId ? stateFor(artifactId).context : { values: initialShared(), frames: new Set() };
  const disposeBlock = (container: HTMLElement): void => {
    const frame = frames.get(container);
    if (frame) {
      frame.dispose();
      frames.delete(container);
    }
  };
  const disposeFrame = (frame: FrameController): void => {
    const entry = Array.from(frames.entries()).find(([, value]) => value === frame);
    if (entry) frames.delete(entry[0]);
    frame.dispose();
  };
  const mountBlock = (block: SlexKitMarkdownBlock): (() => void) => {
    if (typeof block.source !== "string")
      throw new TypeError("SlexKit HTML source must be a string.");
    const inspected = inspectSlexSource(block.source);
    if (!inspected.ok) throw inspected.error;
    disposeBlock(block.container);
    const frame = new FrameController(block, options, contextFor(block.artifactId));
    frames.set(block.container, frame);
    if (block.executionMode !== "preview")
      void frame.commit(block.source).catch((error) => console.error(error));
    return () => disposeBlock(block.container);
  };
  const enqueueArtifact = <T>(
    artifactId: string,
    operation: (epoch: number) => Promise<T>,
  ): Promise<T> => {
    const state = stateFor(artifactId);
    const epoch = ++state.epoch;
    const task = state.tail.then(() => operation(epoch));
    state.tail = task.then(
      () => {},
      () => {},
    );
    return task;
  };
  return {
    configure(next) {
      options = { ...options, ...next };
    },
    getMode() {
      return "secure";
    },
    mountBlock,
    disposeBlock,
    disposeArtifact(artifactId) {
      const state = artifacts.get(artifactId);
      if (state) state.epoch++;
      for (const [container, frame] of frames)
        if (frame.artifactId === artifactId) disposeBlock(container);
      artifacts.delete(artifactId);
    },
    disposeAll() {
      for (const state of artifacts.values()) state.epoch++;
      for (const frame of Array.from(frames.values())) frame.dispose();
      frames.clear();
      artifacts.clear();
    },
    updateArtifact(artifactId, blocks, updateOptions) {
      const ids = new Set<string>();
      const containers = new Set<HTMLElement>();
      for (const block of blocks) {
        if (block.artifactId && block.artifactId !== artifactId)
          return Promise.reject(new Error("Artifact update contains a mismatched artifactId."));
        if (!block.blockId?.trim() || ids.has(block.blockId) || containers.has(block.container))
          return Promise.reject(
            new Error("Artifact blocks require unique, non-empty blockId values and containers."),
          );
        ids.add(block.blockId);
        containers.add(block.container);
        const inspected = inspectSlexSource(block.source);
        if (!inspected.ok) return Promise.reject(inspected.error);
      }
      if (updateOptions.phase === "preview") return Promise.resolve();
      return enqueueArtifact(artifactId, async (epoch) => {
        const state = stateFor(artifactId);
        if (epoch !== state.epoch)
          throw new Error("Artifact update was superseded before execution.");
        const existing = new Map<string, FrameController>();
        for (const frame of frames.values())
          if (frame.artifactId === artifactId) existing.set(frame.blockId, frame);
        const committed: Array<{ frame: FrameController; source: string; created: boolean }> = [];
        try {
          for (const block of blocks) {
            if (epoch !== state.epoch)
              throw new Error("Artifact update was superseded during execution.");
            let frame = existing.get(block.blockId!);
            const moved = frame && frame.iframe.parentElement !== block.container;
            const restoreState =
              moved && !updateOptions.reset ? frame!.relocationState() : undefined;
            if (moved) {
              disposeFrame(frame!);
              frame = undefined;
            }
            const created = !frame;
            if (!frame) {
              disposeBlock(block.container);
              frame = new FrameController(
                { ...block, artifactId },
                options,
                state.context,
                restoreState,
              );
              frames.set(block.container, frame);
            }
            const previous = frame.currentSource();
            frame.updateBlock({ ...block, artifactId });
            committed.push({ frame, source: previous, created });
            await frame.commit(block.source, !!updateOptions.reset);
            existing.delete(block.blockId!);
          }
        } catch (error) {
          for (const item of committed.reverse()) {
            if (item.created && !item.source) {
              const entry = Array.from(frames.entries()).find(([, value]) => value === item.frame);
              if (entry) disposeBlock(entry[0]);
            } else {
              try {
                await item.frame.commit(item.source);
              } catch {
                /* Runner already attempted local rollback. */
              }
            }
          }
          throw error;
        }
        for (const frame of existing.values()) {
          const entry = Array.from(frames.entries()).find(([, value]) => value === frame);
          if (entry) disposeBlock(entry[0]);
        }
      });
    },
    resetArtifact(artifactId) {
      return enqueueArtifact(artifactId, async (epoch) => {
        const state = stateFor(artifactId);
        for (const frame of Array.from(frames.values()).filter(
          (item) => item.artifactId === artifactId,
        )) {
          if (epoch !== state.epoch) throw new Error("Artifact reset was superseded.");
          await frame.reset();
        }
      });
    },
  };
}

export function mount(
  source: string,
  container: HTMLElement,
  options: HtmlMountOptions = {},
): HtmlMountHandle {
  if (typeof source !== "string") throw new TypeError("SlexKit HTML source must be a string.");
  const shared: SharedContext = { values: {}, frames: new Set() };
  const block: SlexKitMarkdownBlock = {
    source,
    container,
    artifactId: options.artifactId,
    blockId: options.blockId ?? "root",
    theme: options.theme,
    dir: options.dir,
  };
  const frame = new FrameController(block, options, shared);
  const initial = frame.commit(source);
  const dispose = (() => frame.dispose()) as HtmlMountHandle;
  dispose.ready = initial;
  dispose.update = (next, updateOptions) => frame.commit(next, !!updateOptions?.reset);
  dispose.reset = () => frame.reset();
  dispose.snapshot = () => frame.snapshot();
  return dispose;
}
