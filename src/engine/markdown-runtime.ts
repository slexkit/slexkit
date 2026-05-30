import { disposeNamespace, ingest, mount, mountSecureArtifact } from "./index";
import { parseSlexSource } from "./diagnostics";
import type { SlexExpression, MountOptions, ThemeMode } from "./types";
import type { HostRuntimeAdapter, HostRuntimePolicy, SecureFrameOptions } from "./secure-runtime";

export type SlexKitMarkdownRuntimeMode = "trusted" | "secure";

export type SlexKitMarkdownRuntimeOptions = {
  mode?: SlexKitMarkdownRuntimeMode;
  policy?: HostRuntimePolicy;
  hostAdapter?: HostRuntimeAdapter;
  secureFrame?: boolean | SecureFrameOptions;
  theme?: ThemeMode;
  dir?: MountOptions["dir"];
  labels?: MountOptions["labels"];
};

export type SlexKitMarkdownBlock = {
  artifactId?: string;
  blockId?: string;
  source: SlexExpression | string;
  container: HTMLElement;
  stateOnly?: boolean;
  theme?: ThemeMode;
  dir?: MountOptions["dir"];
  labels?: MountOptions["labels"];
};

export type SlexKitMarkdownRuntimeHost = {
  configure(options: Partial<SlexKitMarkdownRuntimeOptions>): void;
  getMode(): SlexKitMarkdownRuntimeMode;
  mountBlock(block: SlexKitMarkdownBlock): () => void;
  disposeBlock(container: HTMLElement): void;
  disposeArtifact(artifactId: string): void;
  disposeAll(): void;
};

const DEFAULT_POLICY: HostRuntimePolicy = {};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isRenderableSource(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if ("layout" in value) return isRecord(value.layout) && Object.keys(value.layout).length > 0;
  if ("namespace" in value || "g" in value) return false;
  return Object.keys(value).some((key) => key.includes(":"));
}

function bareLayoutFromSource(value: Record<string, unknown>): Record<string, unknown> {
  const { slex: _slex, namespace: _namespace, g: _g, layout: _layout, ...layout } = value;
  return layout;
}

function isStateOnlySource(value: unknown): boolean {
  return isRecord(value)
    && !isRenderableSource(value)
    && ("slex" in value || "namespace" in value || "g" in value);
}

function isSlexExpressionEnvelope(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && ("slex" in value || "namespace" in value || "g" in value || "layout" in value);
}

function parseTrustedSource(source: SlexExpression | string): unknown {
  if (typeof source !== "string") return source;
  const parsed = parseSlexSource(source);
  return parsed.ok ? parsed.value : source;
}

function scopedTrustedSource(source: unknown, artifactId: string | undefined): SlexExpression | string {
  if (!artifactId || !isSlexExpressionEnvelope(source)) {
    return source as SlexExpression | string;
  }
  if (!("layout" in source) && isRenderableSource(source)) {
    return {
      slex: typeof source.slex === "string" ? source.slex : undefined,
      namespace: `${artifactId}::${String(source.namespace || "default")}`,
      g: isRecord(source.g) ? source.g : {},
      layout: bareLayoutFromSource(source),
    } as SlexExpression;
  }
  return {
    ...source,
    namespace: `${artifactId}::${String(source.namespace || "default")}`,
  } as SlexExpression;
}

function namespaceFromSource(source: unknown): string | undefined {
  if (!isSlexExpressionEnvelope(source)) return undefined;
  return String(source.namespace || "default");
}

function compareDocumentOrder(a: HTMLElement, b: HTMLElement): number {
  if (a === b) return 0;
  const position = a.compareDocumentPosition(b);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}

export function createSlexKitMarkdownRuntimeHost(
  initialOptions: SlexKitMarkdownRuntimeOptions = {},
): SlexKitMarkdownRuntimeHost {
  let options: SlexKitMarkdownRuntimeOptions = {
    mode: "trusted",
    secureFrame: true,
    policy: DEFAULT_POLICY,
    ...initialOptions,
  };
  const cleanups = new Map<HTMLElement, () => void>();
  const artifactContainers = new Map<string, Set<HTMLElement>>();
  const artifactSources = new Map<string, Map<HTMLElement, SlexExpression | string>>();
  const secureArtifactAnchors = new Map<string, HTMLElement>();
  const secureArtifactCleanups = new Map<string, () => void>();
  const trustedArtifactNamespaces = new Map<string, Set<string>>();

  function rememberTrustedArtifactNamespace(artifactId: string | undefined, source: unknown): void {
    if (!artifactId) return;
    const namespace = namespaceFromSource(source);
    if (!namespace) return;
    let namespaces = trustedArtifactNamespaces.get(artifactId);
    if (!namespaces) {
      namespaces = new Set();
      trustedArtifactNamespaces.set(artifactId, namespaces);
    }
    namespaces.add(`${artifactId}::${namespace}`);
  }

  function disposeTrustedArtifactNamespaces(artifactId: string): void {
    const namespaces = trustedArtifactNamespaces.get(artifactId);
    if (!namespaces) return;
    for (const namespace of namespaces) disposeNamespace(namespace);
    trustedArtifactNamespaces.delete(artifactId);
  }

  function composeSecureArtifactSource(artifactId: string): SlexExpression | string {
    const sources = artifactSources.get(artifactId);
    if (!sources) return "";
    const orderedSources = Array.from(sources.entries())
      .sort(([a], [b]) => compareDocumentOrder(a, b))
      .map(([, source]) => source);
    const serializedSources = JSON.stringify(orderedSources.map((source) => ({
      kind: typeof source === "string" ? "script" : "json",
      source: encodeURIComponent(typeof source === "string" ? source : JSON.stringify(source)),
    })));
    const artifactPrefix = JSON.stringify(`${artifactId}::`);
    return `(() => {
      const __sources = ${serializedSources}.map((entry) => ({
        kind: entry.kind,
        source: decodeURIComponent(entry.source),
      }));
      const __isRecord = (value) => !!value && typeof value === "object" && !Array.isArray(value);
      const __merge = (target, source) => {
        if (!__isRecord(source)) return target;
        for (const [key, value] of Object.entries(source)) {
          if (__isRecord(value) && __isRecord(target[key])) __merge(target[key], value);
          else target[key] = value;
        }
        return target;
      };
      const __isRenderableTree = (value) => __isRecord(value) && Object.keys(value).some((key) => key.includes(":"));
      const __artifactPrefix = ${artifactPrefix};
      const __target = { slex: "0.1", namespace: __artifactPrefix + "default", g: {}, layout: {} };
      const __layouts = [];
      for (const __entry of __sources) {
        const __script = __entry.kind === "json" ? JSON.parse(__entry.source) : (0, eval)("(" + __entry.source + ")");
        if (!__isRecord(__script)) continue;
        if ("slex" in __script) __target.slex = String(__script.slex || "0.1");
        if ("namespace" in __script) __target.namespace = __artifactPrefix + String(__script.namespace || "default");
        if (__isRecord(__script.g)) __merge(__target.g, __script.g);
        if (__isRecord(__script.layout) && Object.keys(__script.layout).length > 0) __layouts.push(__script.layout);
        else if (!("namespace" in __script) && !("g" in __script) && !("layout" in __script) && __isRenderableTree(__script)) {
          const { slex: __slex, ...__layout } = __script;
          __layouts.push(__layout);
        }
      }
      if (__layouts.length === 1) {
        __target.layout = { "column:block_0": Object.assign({}, __layouts[0], { id: "slexkit-slot-slot_0" }) };
      } else if (__layouts.length > 1) {
        __target.layout = {
          "column:artifact": Object.fromEntries(
            __layouts.map((layout, index) => ["column:block_" + index, Object.assign({}, layout, { id: "slexkit-slot-slot_" + index })]),
          ),
        };
      }
      return __target;
    })()`;
  }

  function addArtifactContainer(artifactId: string, container: HTMLElement): void {
    let containers = artifactContainers.get(artifactId);
    if (!containers) {
      containers = new Set();
      artifactContainers.set(artifactId, containers);
    }
    containers.add(container);
  }

  function addArtifactSource(block: SlexKitMarkdownBlock): string {
    const artifactId = block.artifactId as string;
    let sources = artifactSources.get(artifactId);
    if (!sources) {
      sources = new Map();
      artifactSources.set(artifactId, sources);
    }
    sources.set(block.container, block.source);
    addArtifactContainer(artifactId, block.container);
    return artifactId;
  }

  function clearSecureSlot(container: HTMLElement): void {
    delete container.dataset.slexkitSecureArtifactSlot;
    container.replaceChildren();
  }

  function selectSecureArtifactAnchor(artifactId: string): HTMLElement | undefined {
    const containers = artifactContainers.get(artifactId);
    if (!containers?.size) return undefined;
    return Array.from(containers).sort(compareDocumentOrder)[0];
  }

  function remountSecureArtifact(artifactId: string, theme?: ThemeMode): void {
    const anchor = secureArtifactAnchors.get(artifactId);
    if (!anchor) return;
    secureArtifactCleanups.get(artifactId)?.();
    secureArtifactCleanups.delete(artifactId);
    clearSecureSlot(anchor);

    const containers = artifactContainers.get(artifactId) ?? new Set<HTMLElement>();
    const orderedContainers = Array.from(containers).sort(compareDocumentOrder);
    for (const container of containers) {
      if (container === anchor) continue;
      clearSecureSlot(container);
      container.dataset.slexkitSecureArtifactSlot = "true";
    }

    const cleanup = mountSecureArtifact(composeSecureArtifactSource(artifactId), anchor, {
      theme,
      dir: options.dir,
      labels: options.labels,
      policy: options.policy ?? DEFAULT_POLICY,
      hostAdapter: options.hostAdapter,
      frame: options.secureFrame ?? true,
      artifactSlots: orderedContainers.map((container, index) => ({
        id: `slot_${index}`,
        container,
      })),
    });
    secureArtifactCleanups.set(artifactId, cleanup);
  }

  function mountSecureBlock(block: SlexKitMarkdownBlock): () => void {
    if (!block.artifactId) {
      const cleanup = mountSecureArtifact(block.source, block.container, {
        theme: block.theme ?? options.theme,
        dir: block.dir ?? options.dir,
        labels: block.labels ?? options.labels,
        policy: options.policy ?? DEFAULT_POLICY,
        hostAdapter: options.hostAdapter,
        frame: options.secureFrame ?? true,
      });
      return remember(block, cleanup);
    }

    const artifactId = addArtifactSource(block);
    const anchor = selectSecureArtifactAnchor(artifactId);
    if (anchor) secureArtifactAnchors.set(artifactId, anchor);
    remountSecureArtifact(artifactId, block.theme ?? options.theme);

    const cleanup = () => {
      artifactSources.get(artifactId)?.delete(block.container);
      artifactContainers.get(artifactId)?.delete(block.container);
      cleanups.delete(block.container);
      clearSecureSlot(block.container);

      const sources = artifactSources.get(artifactId);
      const containers = artifactContainers.get(artifactId);
      if (!sources?.size || !containers?.size) {
        secureArtifactCleanups.get(artifactId)?.();
        secureArtifactCleanups.delete(artifactId);
        secureArtifactAnchors.delete(artifactId);
        artifactSources.delete(artifactId);
        artifactContainers.delete(artifactId);
        return;
      }

      if (secureArtifactAnchors.get(artifactId) === block.container) {
        const nextAnchor = selectSecureArtifactAnchor(artifactId);
        if (nextAnchor) secureArtifactAnchors.set(artifactId, nextAnchor);
      }
      remountSecureArtifact(artifactId, block.theme ?? options.theme);
    };

    cleanups.set(block.container, cleanup);
    return cleanup;
  }

  function remember(block: SlexKitMarkdownBlock, cleanup: () => void): () => void {
    cleanups.set(block.container, cleanup);
    if (block.artifactId) {
      addArtifactContainer(block.artifactId, block.container);
    }

    return () => {
      cleanup();
      cleanups.delete(block.container);
      if (!block.artifactId) return;
      const containers = artifactContainers.get(block.artifactId);
      containers?.delete(block.container);
      if (containers?.size === 0) artifactContainers.delete(block.artifactId);
    };
  }

  function disposeBlock(container: HTMLElement): void {
    const cleanup = cleanups.get(container);
    if (!cleanup) return;
    cleanup();
    cleanups.delete(container);
    for (const [artifactId, containers] of artifactContainers) {
      containers.delete(container);
      artifactSources.get(artifactId)?.delete(container);
      if (secureArtifactAnchors.get(artifactId) === container) {
        const nextAnchor = selectSecureArtifactAnchor(artifactId);
        if (nextAnchor) secureArtifactAnchors.set(artifactId, nextAnchor);
        else secureArtifactAnchors.delete(artifactId);
      }
      if (containers.size === 0) artifactContainers.delete(artifactId);
      if (artifactSources.get(artifactId)?.size === 0) artifactSources.delete(artifactId);
    }
  }

  return {
    configure(nextOptions) {
      options = { ...options, ...nextOptions };
    },
    getMode() {
      return options.mode ?? "trusted";
    },
    mountBlock(block) {
      disposeBlock(block.container);
      block.container.replaceChildren();

      const mode = options.mode ?? "trusted";
      if (mode === "secure") return mountSecureBlock(block);

      const parsedSource = parseTrustedSource(block.source);
      rememberTrustedArtifactNamespace(block.artifactId, parsedSource);
      const trustedSource = scopedTrustedSource(parsedSource, block.artifactId);
      const stateOnly = block.stateOnly ?? isStateOnlySource(trustedSource);

      if (stateOnly) {
        const ok = ingest(trustedSource);
        if (!ok) throw new Error("Failed to parse Slex state block.");
        return remember(block, () => {});
      }

      const theme = block.theme ?? options.theme;
      const cleanup = mount(trustedSource, block.container, {
        theme,
        dir: block.dir ?? options.dir,
        labels: block.labels ?? options.labels,
      });

      return remember(block, cleanup);
    },
    disposeBlock,
    disposeArtifact(artifactId) {
      const containers = Array.from(artifactContainers.get(artifactId) ?? []);
      for (const container of containers) disposeBlock(container);
      secureArtifactCleanups.get(artifactId)?.();
      secureArtifactCleanups.delete(artifactId);
      secureArtifactAnchors.delete(artifactId);
      artifactContainers.delete(artifactId);
      artifactSources.delete(artifactId);
      disposeTrustedArtifactNamespaces(artifactId);
    },
    disposeAll() {
      for (const container of Array.from(cleanups.keys())) disposeBlock(container);
      for (const cleanup of Array.from(secureArtifactCleanups.values())) cleanup();
      secureArtifactCleanups.clear();
      secureArtifactAnchors.clear();
      artifactContainers.clear();
      artifactSources.clear();
      for (const artifactId of Array.from(trustedArtifactNamespaces.keys())) {
        disposeTrustedArtifactNamespaces(artifactId);
      }
    },
  };
}

let globalMarkdownRuntimeHost: SlexKitMarkdownRuntimeHost | undefined;

export function installSlexKitMarkdownRuntimeHost(
  options: SlexKitMarkdownRuntimeOptions = {},
): SlexKitMarkdownRuntimeHost {
  globalMarkdownRuntimeHost = createSlexKitMarkdownRuntimeHost(options);
  return globalMarkdownRuntimeHost;
}

export function getSlexKitMarkdownRuntimeHost(): SlexKitMarkdownRuntimeHost {
  if (!globalMarkdownRuntimeHost) {
    globalMarkdownRuntimeHost = createSlexKitMarkdownRuntimeHost();
  }
  return globalMarkdownRuntimeHost;
}
