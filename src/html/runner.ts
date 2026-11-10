import {
  createSecureRuntime,
  type HostRuntimePolicy,
  type NetworkResult,
  type SecureRuntimeHandle,
} from "../engine/secure-runtime";
import { defineSlexElements } from "../web-components";
import {
  createDocumentStyleSheet,
  decodeCssDataUrl,
  replaceDocumentStyles,
} from "../web-components/styles";
import { captureControlSnapshot, reconcileHtml, restoreControlSnapshot } from "./reconcile";
import {
  HTML_CHANNEL,
  cloneJsonValue,
  isFrameCommand,
  isJsonValue,
  isRecord,
  isSharedKey,
  serializedError,
  type HtmlFrameCommand,
  type HtmlRunnerMessage,
  type HtmlThemeState,
} from "./protocol";
import type { SlexDocumentSdk } from "./types";

export type SandboxRunnerOptions = {
  /** Authenticated bootstrap sender, including hosts mounting into another document. */
  hostWindow?: Window;
  token: string;
  epoch: number;
  /** A host-authored second CSP. It intersects the bootstrap policy before payload code runs. */
  lockedCsp: string;
  policy?: HostRuntimePolicy;
  styleUrl?: string | false;
  theme?: HtmlThemeState;
  dir?: "ltr" | "rtl" | "auto";
  shared?: Record<string, unknown>;
};

type ScriptSource = { key: string; code: string };
type PreparedSource = {
  html: string;
  scripts: ScriptSource[];
  styleSheets: CSSStyleSheet[];
};
type ModuleScope = {
  source: ScriptSource;
  revision: number;
  controller: AbortController;
  active: boolean;
  dispose: Array<() => void | Promise<void>>;
  snapshots: Array<() => unknown | Promise<unknown>>;
  restores: Array<(value: unknown) => void | Promise<void>>;
  sharedStops: Set<() => void>;
  apiRequests: Set<string>;
  runtime: SecureRuntimeHandle;
};
type ApiPending = {
  revision: number;
  scope: ModuleScope;
  resolve(value: NetworkResult): void;
  reject(error: Error): void;
};
type StripRunnerEnvelope<T> = T extends unknown ? Omit<T, "channel" | "token" | "epoch"> : never;
type RunnerPayload = StripRunnerEnvelope<HtmlRunnerMessage>;

function safeResponse(options: SandboxRunnerOptions, message: RunnerPayload): boolean {
  try {
    (options.hostWindow ?? parent).postMessage(
      {
        channel: HTML_CHANNEL,
        token: options.token,
        epoch: options.epoch,
        ...message,
      } as HtmlRunnerMessage,
      "*",
    );
    return true;
  } catch {
    return false;
  }
}

function preparedSource(source: string): PreparedSource {
  const template = document.createElement("template");
  template.innerHTML = source;
  const styleSheets: CSSStyleSheet[] = [];
  for (const style of Array.from(template.content.querySelectorAll("style"))) {
    const media = style.media.trim();
    const cssText = media
      ? `@media ${media}{\n${style.textContent ?? ""}\n}`
      : (style.textContent ?? "");
    const sheet = createDocumentStyleSheet(document, cssText);
    if (!sheet)
      throw new Error("This browser does not support constructed stylesheets required by SlexKit.");
    styleSheets.push(sheet);
    style.remove();
  }
  const scripts: ScriptSource[] = [];
  let index = 0;
  for (const script of Array.from(template.content.querySelectorAll("script"))) {
    const type = (script.getAttribute("type") ?? "module").trim().toLowerCase();
    const inert =
      type && type !== "module" && !/^(?:text|application)\/(?:java|ecma)script$/.test(type);
    if (inert) continue;
    scripts.push({
      key: script.dataset.key || script.id || `script:${index++}`,
      code: script.textContent ?? "",
    });
    script.remove();
  }
  return { html: template.innerHTML, scripts, styleSheets };
}

function signature(scripts: readonly ScriptSource[]): string {
  return scripts.map((item) => `${item.key}\0${item.code}`).join("\x01");
}

function actualContentHeight(root: HTMLElement): number {
  const rect = root.getBoundingClientRect();
  return Math.max(0, Math.ceil(Math.max(root.scrollHeight, root.offsetHeight, rect.height)));
}

export function startSlexKitSandboxRunner(options: SandboxRunnerOptions): () => void {
  if (
    !options ||
    typeof options.token !== "string" ||
    options.token.length < 16 ||
    !Number.isSafeInteger(options.epoch) ||
    options.epoch < 1 ||
    typeof options.lockedCsp !== "string" ||
    !options.lockedCsp.startsWith("default-src 'none'; script-src blob:")
  ) {
    throw new TypeError("Valid sandbox authentication and locked CSP options are required.");
  }
  const lockedPolicy = document.createElement("meta");
  lockedPolicy.httpEquiv = "Content-Security-Policy";
  lockedPolicy.content = options.lockedCsp;
  document.head.append(lockedPolicy);
  const stylesheetUrl =
    options.styleUrl === false
      ? undefined
      : new URL(options.styleUrl ?? "./slexkit.css", import.meta.url).href;
  const stylesheetCssText = stylesheetUrl?.startsWith("data:")
    ? decodeCssDataUrl(stylesheetUrl)
    : undefined;
  defineSlexElements({
    window: window as Window & typeof globalThis,
    ...(stylesheetUrl && stylesheetCssText === undefined ? { stylesheetUrl } : {}),
    ...(stylesheetCssText !== undefined ? { cssText: stylesheetCssText } : {}),
    ...(options.styleUrl === false ? { cssText: "" } : {}),
  });
  const root = document.createElement("main");
  root.id = "slex-root";
  document.body.replaceChildren(root);
  if (options.dir) document.documentElement.dir = options.dir;

  let revision = 0;
  let scheduledRevision = 0;
  let source = "";
  let sourceId = "";
  let disposed = false;
  let disposing = false;
  let scopes: ModuleScope[] = [];
  let scriptSources: ScriptSource[] = [];
  let styleSheets: CSSStyleSheet[] = [];
  let apiSequence = 0;
  let operationQueue = Promise.resolve();
  const shared = new Map<string, unknown>(Object.entries(cloneJsonValue(options.shared ?? {})));
  const sharedListeners = new Map<string, Set<(value: unknown) => void>>();
  const apiPending = new Map<string, ApiPending>();
  const appliedTokens = new Set<string>();

  const applyTheme = (theme: HtmlThemeState | undefined): void => {
    if (!theme) return;
    const html = document.documentElement;
    html.dataset.slexkitTheme = theme.name ?? theme.mode;
    html.dataset.theme = theme.mode;
    html.classList.toggle("dark", theme.mode === "dark");
    html.classList.toggle("light", theme.mode === "light");
    html.style.colorScheme = theme.mode;
    for (const key of appliedTokens) if (!(key in theme.tokens)) html.style.removeProperty(key);
    appliedTokens.clear();
    for (const [key, value] of Object.entries(theme.tokens)) {
      html.style.setProperty(key, value);
      appliedTokens.add(key);
    }
  };
  applyTheme(options.theme);

  const rejectScopeRequests = (scope: ModuleScope, reason: Error): void => {
    for (const requestId of scope.apiRequests) {
      const pending = apiPending.get(requestId);
      if (pending) {
        apiPending.delete(requestId);
        pending.reject(reason);
      }
    }
    scope.apiRequests.clear();
  };

  const disposeScope = async (scope: ModuleScope): Promise<void> => {
    if (!scope.active) return;
    scope.active = false;
    scope.controller.abort();
    rejectScopeRequests(scope, new Error("SlexKit module scope was replaced or disposed."));
    scope.runtime.dispose();
    for (const stop of scope.sharedStops) stop();
    scope.sharedStops.clear();
    for (const callback of [...scope.dispose].reverse()) {
      try {
        await callback();
      } catch (error) {
        safeResponse(options, {
          kind: "error",
          requestId: "dispose",
          revision: scope.revision,
          error: serializedError(error),
        });
      }
    }
    scope.dispose.length = scope.snapshots.length = scope.restores.length = 0;
  };
  const disposeScopes = async (targets = scopes): Promise<void> => {
    for (const scope of [...targets].reverse()) await disposeScope(scope);
    if (targets === scopes) scopes = [];
  };

  const createScope = (item: ScriptSource, scopeRevision: number): ModuleScope => {
    const controller = new AbortController();
    const runtime = createSecureRuntime(options.policy ?? {}, {
      fetch(request) {
        if (disposed || disposing || !scope.active)
          return Promise.reject(new Error("SlexKit module scope is no longer active."));
        const requestId = `api:${++apiSequence}`;
        return new Promise<NetworkResult>((resolve, reject) => {
          scope.apiRequests.add(requestId);
          apiPending.set(requestId, { revision: scope.revision, scope, resolve, reject });
          if (
            !safeResponse(options, {
              kind: "api-fetch",
              requestId,
              revision: scope.revision,
              url: request.url,
              options: {
                method: request.method,
                headers: request.headers,
                body: request.body,
                credentials: request.credentials,
                timeoutMs: request.timeoutMs,
              },
            })
          ) {
            scope.apiRequests.delete(requestId);
            apiPending.delete(requestId);
            reject(new Error("Unable to reach the SlexKit host."));
          }
        });
      },
    });
    const scope: ModuleScope = {
      source: item,
      revision: scopeRevision,
      controller,
      active: true,
      dispose: [],
      snapshots: [],
      restores: [],
      sharedStops: new Set(),
      apiRequests: new Set(),
      runtime,
    };
    return scope;
  };

  const sdkFor = (scope: ModuleScope): SlexDocumentSdk => ({
    root,
    signal: scope.controller.signal,
    onDispose(callback) {
      if (!scope.active || typeof callback !== "function")
        throw new Error("This SlexKit module scope is no longer active.");
      scope.dispose.push(callback);
    },
    onSnapshot(callback) {
      if (!scope.active || typeof callback !== "function")
        throw new Error("This SlexKit module scope is no longer active.");
      scope.snapshots.push(callback);
    },
    onRestore(callback) {
      if (!scope.active || typeof callback !== "function")
        throw new Error("This SlexKit module scope is no longer active.");
      scope.restores.push(callback);
    },
    api: scope.runtime.api,
    shared: {
      get<T>(key: string) {
        return shared.get(key) as T | undefined;
      },
      async set(key, value) {
        if (!scope.active) throw new Error("This SlexKit module scope is no longer active.");
        if (!isSharedKey(key) || !isJsonValue(value))
          throw new TypeError("Shared state requires a bounded non-empty key and JSON value.");
        safeResponse(options, {
          kind: "shared-set",
          requestId: `shared:${++apiSequence}`,
          revision: scope.revision,
          key,
          value: cloneJsonValue(value),
        });
      },
      subscribe(key, listener) {
        if (!scope.active || typeof listener !== "function")
          throw new Error("This SlexKit module scope is no longer active.");
        let listeners = sharedListeners.get(key);
        if (!listeners) sharedListeners.set(key, (listeners = new Set()));
        listeners.add(listener);
        listener(shared.get(key));
        const stop = () => {
          listeners?.delete(listener);
          scope.sharedStops.delete(stop);
        };
        scope.sharedStops.add(stop);
        return stop;
      },
    },
  });

  const execute = async (items: ScriptSource[], restoreValue?: unknown): Promise<ModuleScope[]> => {
    const created: ModuleScope[] = [];
    try {
      for (const item of items) {
        const scope = createScope(item, revision);
        created.push(scope);
        const sdk = sdkFor(scope);
        Object.defineProperty(globalThis, "slex", { configurable: true, value: sdk });
        const code = `const slex = globalThis.slex;\n${item.code}\n//# sourceURL=slexkit-inline-module.js`;
        const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
        try {
          await import(/* @vite-ignore */ url);
        } finally {
          URL.revokeObjectURL(url);
        }
      }
      if (isRecord(restoreValue) && Array.isArray(restoreValue.hidden)) {
        for (let scopeIndex = 0; scopeIndex < created.length; scopeIndex++) {
          const values = Array.isArray(restoreValue.hidden[scopeIndex])
            ? restoreValue.hidden[scopeIndex]
            : [];
          for (let index = 0; index < created[scopeIndex].restores.length; index++)
            await created[scopeIndex].restores[index](values[index]);
        }
      }
      return created;
    } catch (error) {
      await disposeScopes(created);
      throw error;
    }
  };

  const snapshot = async (): Promise<unknown> => {
    const hidden: unknown[][] = [];
    for (const scope of scopes) {
      const values: unknown[] = [];
      for (const handler of scope.snapshots) values.push(await handler());
      hidden.push(values);
    }
    const value = { version: 1, hidden, controls: captureControlSnapshot(root) };
    if (!isJsonValue(value))
      throw new TypeError(
        "Snapshot handlers and visible controls must return bounded JSON values.",
      );
    return cloneJsonValue(value);
  };

  const commit = async (
    nextSource: string,
    reset: boolean,
    restoreValue?: unknown,
  ): Promise<void> => {
    const next = preparedSource(nextSource);
    const changedScripts = reset || signature(next.scripts) !== signature(scriptSources);
    if (!changedScripts) {
      const previousControls = captureControlSnapshot(root);
      try {
        reconcileHtml(root, next.html, { reset });
        replaceDocumentStyles(document, styleSheets, next.styleSheets);
      } catch (error) {
        try {
          const previous = preparedSource(source);
          reconcileHtml(root, previous.html);
          replaceDocumentStyles(document, next.styleSheets, styleSheets);
          restoreControlSnapshot(root, previousControls);
        } catch (rollbackError) {
          throw new AggregateError(
            [error, rollbackError],
            "SlexKit style update failed and the last usable version could not be restored.",
          );
        }
        throw error;
      }
      styleSheets = next.styleSheets;
      source = nextSource;
      return;
    }
    const previousSource = source;
    const previousScripts = scriptSources;
    const previousStyleSheets = styleSheets;
    const previousState = scopes.length ? await snapshot() : undefined;
    const previousControls = captureControlSnapshot(root);
    await disposeScopes();
    try {
      reconcileHtml(root, next.html, { reset });
      if (!reset && isRecord(restoreValue) && restoreValue.controls !== undefined)
        restoreControlSnapshot(root, restoreValue.controls);
      replaceDocumentStyles(document, previousStyleSheets, next.styleSheets);
      scopes = await execute(next.scripts, reset ? undefined : (restoreValue ?? previousState));
      scriptSources = next.scripts;
      styleSheets = next.styleSheets;
      source = nextSource;
    } catch (error) {
      const original = error;
      let rollbackStyleSheets: CSSStyleSheet[] = [];
      try {
        const previous = preparedSource(previousSource);
        rollbackStyleSheets = previous.styleSheets;
        reconcileHtml(root, previous.html);
        replaceDocumentStyles(
          document,
          [...next.styleSheets, ...previousStyleSheets],
          previous.styleSheets,
        );
        restoreControlSnapshot(root, previousControls);
        scopes = await execute(previousScripts, previousState);
        scriptSources = previousScripts;
        styleSheets = previous.styleSheets;
        rollbackStyleSheets = [];
        source = previousSource;
      } catch (rollbackError) {
        replaceDocumentStyles(
          document,
          [...next.styleSheets, ...previousStyleSheets, ...rollbackStyleSheets],
          [],
        );
        styleSheets = [];
        throw new AggregateError(
          [original, rollbackError],
          "SlexKit commit failed and the last usable version could not be fully restored.",
        );
      }
      throw original;
    }
  };

  const sendHeight = (): void => {
    if (!disposed)
      safeResponse(options, {
        kind: "height",
        requestId: "height",
        revision,
        height: actualContentHeight(root),
      });
  };
  let stateNotificationQueued = false;
  const sendState = (): void => {
    if (disposed || disposing || !sourceId) return;
    const expectedRevision = revision;
    const expectedSourceId = sourceId;
    void operationQueue
      .then(async () => {
        if (disposed || disposing || expectedRevision !== revision || expectedSourceId !== sourceId)
          return;
        const state = await snapshot();
        if (disposed || disposing || expectedRevision !== revision || expectedSourceId !== sourceId)
          return;
        safeResponse(options, {
          kind: "state",
          requestId: "state",
          revision: expectedRevision,
          sourceId: expectedSourceId,
          state,
        });
      })
      .catch((error) => {
        safeResponse(options, {
          kind: "error",
          requestId: "state",
          revision: expectedRevision,
          error: serializedError(error),
        });
      });
  };
  const queueStateNotification = (): void => {
    if (stateNotificationQueued || disposed || disposing) return;
    stateNotificationQueued = true;
    queueMicrotask(() => {
      stateNotificationQueued = false;
      sendState();
    });
  };
  const stateListener = (): void => queueStateNotification();
  addEventListener("input", stateListener);
  addEventListener("change", stateListener);
  addEventListener("click", stateListener);
  const observer = new ResizeObserver(sendHeight);
  observer.observe(root);

  const settle = (message: HtmlFrameCommand, task: () => Promise<unknown>): void => {
    operationQueue = operationQueue.then(task).then(
      (result) => {
        safeResponse(options, {
          kind: "result",
          requestId: message.requestId,
          revision: message.revision,
          ok: true,
          ...(result === undefined ? {} : { result }),
        });
        sendHeight();
      },
      (error) => {
        safeResponse(options, {
          kind: "result",
          requestId: message.requestId,
          revision: message.revision,
          ok: false,
          error: serializedError(error),
        });
      },
    );
  };

  const onMessage = (event: MessageEvent): void => {
    if (
      event.source !== (options.hostWindow ?? parent) ||
      !isFrameCommand(event.data, options.token, options.epoch) ||
      disposed
    )
      return;
    const message = event.data;
    if (message.kind === "api-result") {
      const pending = apiPending.get(message.requestId);
      if (!pending || message.revision !== pending.revision || !pending.scope.active) return;
      apiPending.delete(message.requestId);
      pending.scope.apiRequests.delete(message.requestId);
      if (message.error)
        pending.reject(
          Object.assign(new Error(message.error.message), { name: message.error.name }),
        );
      else pending.resolve(message.result!);
      return;
    }
    if (message.kind === "shared-state") {
      if (message.revision !== revision) return;
      for (const [key, value] of Object.entries(message.shared)) {
        const copy = cloneJsonValue(value);
        shared.set(key, copy);
        for (const listener of sharedListeners.get(key) ?? []) listener(copy);
      }
      return;
    }
    if (message.kind === "theme") {
      if (message.revision !== revision) return;
      applyTheme(message.theme);
      if (message.dir) document.documentElement.dir = message.dir;
      sendHeight();
      return;
    }
    if (message.kind === "commit" || message.kind === "reset") {
      if (disposing || message.revision <= scheduledRevision) {
        safeResponse(options, {
          kind: "result",
          requestId: message.requestId,
          revision: message.revision,
          ok: false,
          error: {
            name: "StaleRevisionError",
            message: "The revision was superseded before execution.",
          },
        });
        return;
      }
      scheduledRevision = message.revision;
      settle(message, async () => {
        if (disposing) throw new Error("SlexKit frame is disposing.");
        revision = message.revision;
        if (message.kind === "commit") {
          if (message.theme) applyTheme(message.theme);
          if (message.dir) document.documentElement.dir = message.dir;
          await commit(message.source, !!message.reset, message.restore);
          sourceId = message.sourceId;
        } else await commit(source, true);
        queueStateNotification();
      });
      return;
    }
    if (message.revision !== revision || disposing) {
      safeResponse(options, {
        kind: "result",
        requestId: message.requestId,
        revision: message.revision,
        ok: false,
        error: {
          name: "StaleRevisionError",
          message: "The request does not target the active revision.",
        },
      });
      return;
    }
    if (message.kind === "snapshot") {
      settle(message, snapshot);
      return;
    }
    if (message.kind === "dispose") {
      disposing = true;
      settle(message, async () => {
        observer.disconnect();
        await disposeScopes();
        root.replaceChildren();
        replaceDocumentStyles(document, styleSheets, []);
        styleSheets = [];
        disposed = true;
        for (const pending of apiPending.values())
          pending.reject(new Error("SlexKit frame was disposed."));
        apiPending.clear();
        removeEventListener("input", stateListener);
        removeEventListener("change", stateListener);
        removeEventListener("click", stateListener);
        removeEventListener("message", messageListener);
      });
    }
  };
  const messageListener = (event: MessageEvent): void => onMessage(event);
  addEventListener("message", messageListener);
  safeResponse(options, { kind: "ready", requestId: "ready", revision: 0, ok: true });
  sendHeight();

  let cleanupStarted = false;
  return () => {
    if (cleanupStarted) return;
    cleanupStarted = true;
    disposing = true;
    observer.disconnect();
    removeEventListener("message", messageListener);
    removeEventListener("input", stateListener);
    removeEventListener("change", stateListener);
    removeEventListener("click", stateListener);
    for (const pending of apiPending.values())
      pending.reject(new Error("SlexKit frame was disposed."));
    apiPending.clear();
    void disposeScopes();
    root.replaceChildren();
    replaceDocumentStyles(document, styleSheets, []);
    styleSheets = [];
    disposed = true;
  };
}
