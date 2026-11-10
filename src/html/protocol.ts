import type { NetworkOptions, NetworkResult } from "../engine/secure-runtime";

export const HTML_CHANNEL = "slexkit-html-v1";
export const MAX_PROTOCOL_STRING = 2_000_000;
export const MAX_REQUEST_ID = 256;
export const MAX_HEIGHT = 10_000_000;
export const MAX_JSON_DEPTH = 64;
export const MAX_JSON_NODES = 20_000;
export function isSharedKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 256 &&
    value !== "__proto__" &&
    value !== "prototype" &&
    value !== "constructor"
  );
}

function isPlainPrototype(prototype: object | null): boolean {
  if (prototype === null || prototype === Object.prototype) return true;
  // postMessage data is cloned into the receiving window's realm, which may
  // differ from this module's realm in Obsidian popouts or foreign documents.
  try {
    if (Object.getPrototypeOf(prototype) !== null) return false;
    const constructor = Object.getOwnPropertyDescriptor(prototype, "constructor");
    return (
      !!constructor &&
      "value" in constructor &&
      typeof constructor.value === "function" &&
      /^function Object\(\)\s*\{\s*\[native code\]\s*\}$/.test(
        Function.prototype.toString.call(constructor.value),
      )
    );
  } catch {
    return false;
  }
}

export type SerializedError = { name: string; message: string };
export type HtmlThemeState = {
  mode: "light" | "dark";
  name?: string;
  tokens: Record<string, string>;
};

type CommandBase = {
  channel: typeof HTML_CHANNEL;
  token: string;
  epoch: number;
  requestId: string;
  revision: number;
};

export type HtmlFrameCommand = CommandBase &
  (
    | {
        kind: "commit";
        source: string;
        sourceId: string;
        restore?: unknown;
        reset?: boolean;
        theme?: HtmlThemeState;
        dir?: "ltr" | "rtl" | "auto";
      }
    | { kind: "reset" }
    | { kind: "snapshot" }
    | { kind: "dispose" }
    | { kind: "theme"; theme: HtmlThemeState; dir?: "ltr" | "rtl" | "auto" }
    | { kind: "shared-state"; shared: Record<string, unknown> }
    | { kind: "api-result"; result?: NetworkResult; error?: SerializedError }
  );

type RunnerBase = {
  channel: typeof HTML_CHANNEL;
  token: string;
  epoch: number;
  requestId: string;
  revision: number;
};

export type HtmlRunnerMessage = RunnerBase &
  (
    | { kind: "ready"; ok: true }
    | { kind: "result"; ok: true; result?: unknown }
    | { kind: "result"; ok: false; error: SerializedError }
    | { kind: "height"; height: number }
    | { kind: "state"; sourceId: string; state: unknown }
    | { kind: "shared-set"; key: string; value: unknown }
    | { kind: "api-fetch"; url: string; options: NetworkOptions }
    | { kind: "error"; error: SerializedError }
  );

export function isRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  try {
    const prototype = Object.getPrototypeOf(value);
    return isPlainPrototype(prototype);
  } catch {
    return false;
  }
}

type JsonBudget = { nodes: number };

function jsonValue(
  value: unknown,
  ancestors: Set<object>,
  verified: WeakSet<object>,
  depth: number,
  budget: JsonBudget,
): boolean {
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "string") return value.length <= MAX_PROTOCOL_STRING;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object" || depth > MAX_JSON_DEPTH) return false;
  if (ancestors.has(value)) return false;
  if (verified.has(value)) return true;
  if (++budget.nodes > MAX_JSON_NODES) return false;
  let descriptors: PropertyDescriptorMap;
  let symbols: symbol[];
  let prototype: object | null;
  try {
    descriptors = Object.getOwnPropertyDescriptors(value);
    symbols = Object.getOwnPropertySymbols(value);
    prototype = Object.getPrototypeOf(value);
  } catch {
    return false;
  }
  if (symbols.length || (!Array.isArray(value) && !isPlainPrototype(prototype))) return false;
  ancestors.add(value);
  let valid = true;
  if (Array.isArray(value)) {
    if (value.length > MAX_JSON_NODES) valid = false;
    for (let index = 0; valid && index < value.length; index++) {
      const descriptor = descriptors[String(index)];
      if (
        !descriptor ||
        !("value" in descriptor) ||
        descriptor.get ||
        descriptor.set ||
        !descriptor.enumerable ||
        !jsonValue(descriptor.value, ancestors, verified, depth + 1, budget)
      )
        valid = false;
    }
    const extra = Object.keys(descriptors).filter(
      (key) => key !== "length" && !/^(?:0|[1-9]\d*)$/.test(key),
    );
    if (extra.length) valid = false;
  } else {
    const keys = Object.keys(descriptors);
    if (keys.length > MAX_JSON_NODES) valid = false;
    for (const key of keys) {
      const descriptor = descriptors[key];
      if (
        key === "__proto__" ||
        key === "prototype" ||
        key === "constructor" ||
        !("value" in descriptor) ||
        descriptor.get ||
        descriptor.set ||
        !descriptor.enumerable ||
        !jsonValue(descriptor.value, ancestors, verified, depth + 1, budget)
      ) {
        valid = false;
        break;
      }
    }
  }
  ancestors.delete(value);
  if (valid) verified.add(value);
  return valid;
}

/** Validates a getter-free JSON graph. Repeated references are allowed; ancestor cycles are not. */
export function isJsonValue(value: unknown): boolean {
  return jsonValue(value, new Set(), new WeakSet(), 0, { nodes: 0 });
}

/** Copies a value only after descriptor-based validation, so no user getter is evaluated. */
export function cloneJsonValue<T>(value: T): T {
  if (!isJsonValue(value)) throw new TypeError("Expected a bounded, getter-free JSON value.");
  const copies = new WeakMap<object, unknown>();
  const clone = (item: unknown): unknown => {
    if (!item || typeof item !== "object") return item;
    const cached = copies.get(item);
    if (cached) return cached;
    const descriptors = Object.getOwnPropertyDescriptors(item);
    if (Array.isArray(item)) {
      const target: unknown[] = [];
      copies.set(item, target);
      for (let index = 0; index < item.length; index++)
        target.push(clone(descriptors[String(index)].value));
      return target;
    }
    const target: Record<string, unknown> = {};
    copies.set(item, target);
    for (const [key, descriptor] of Object.entries(descriptors))
      target[key] = clone(descriptor.value);
    return target;
  };
  return clone(value) as T;
}

function boundedString(value: unknown, max = MAX_PROTOCOL_STRING): value is string {
  return typeof value === "string" && value.length <= max;
}

function validCommon(value: Record<string, unknown>, token: string, epoch?: number): boolean {
  return (
    value.channel === HTML_CHANNEL &&
    value.token === token &&
    Number.isSafeInteger(value.epoch) &&
    (value.epoch as number) >= 0 &&
    (epoch === undefined || value.epoch === epoch) &&
    boundedString(value.requestId, MAX_REQUEST_ID) &&
    value.requestId.length > 0 &&
    Number.isSafeInteger(value.revision) &&
    (value.revision as number) >= 0
  );
}
function onlyKeys(value: Record<string, unknown>, variant: readonly string[]): boolean {
  const allowed = new Set([
    "channel",
    "token",
    "epoch",
    "kind",
    "requestId",
    "revision",
    ...variant,
  ]);
  return Object.keys(value).every((key) => allowed.has(key));
}

export function isSerializedError(value: unknown): value is SerializedError {
  return (
    isRecord(value) &&
    onlyKeys(value, ["name", "message"]) &&
    boundedString(value.name, 128) &&
    value.name.length > 0 &&
    boundedString(value.message, 16_384)
  );
}

export function isThemeState(value: unknown): value is HtmlThemeState {
  if (
    !isRecord(value) ||
    !onlyKeys(value, ["mode", "name", "tokens"]) ||
    (value.mode !== "light" && value.mode !== "dark") ||
    (value.name !== undefined && !boundedString(value.name, 128)) ||
    !isRecord(value.tokens)
  )
    return false;
  const entries = Object.entries(value.tokens);
  return (
    entries.length <= 512 &&
    entries.every(([key, item]) => /^--[\w-]{1,128}$/.test(key) && boundedString(item, 4096))
  );
}

export function isNetworkOptions(value: unknown): value is NetworkOptions {
  if (
    !isRecord(value) ||
    !onlyKeys(value, ["method", "headers", "body", "timeoutMs", "credentials"])
  )
    return false;
  if (value.method !== undefined && value.method !== "GET" && value.method !== "POST") return false;
  if (
    value.credentials !== undefined &&
    !["omit", "same-origin", "include"].includes(value.credentials as string)
  )
    return false;
  if (
    value.timeoutMs !== undefined &&
    (!Number.isFinite(value.timeoutMs) ||
      (value.timeoutMs as number) < 0 ||
      (value.timeoutMs as number) > 300_000)
  )
    return false;
  if (
    value.headers !== undefined &&
    (!isRecord(value.headers) ||
      Object.keys(value.headers).length > 256 ||
      !Object.entries(value.headers).every(
        ([key, item]) => key.length <= 256 && boundedString(item, 16_384),
      ))
  )
    return false;
  return value.body === undefined || isJsonValue(value.body);
}

export function isNetworkResult(value: unknown): value is NetworkResult {
  if (
    !isRecord(value) ||
    !onlyKeys(value, [
      "ok",
      "status",
      "statusText",
      "url",
      "headers",
      "text",
      "data",
      "elapsedMs",
    ]) ||
    typeof value.ok !== "boolean" ||
    !Number.isInteger(value.status) ||
    (value.status as number) < 0 ||
    (value.status as number) > 599 ||
    !boundedString(value.statusText, 4096) ||
    !boundedString(value.url, 16_384) ||
    !isRecord(value.headers) ||
    Object.keys(value.headers).length > 256 ||
    !Object.entries(value.headers).every(
      ([key, item]) => key.length <= 256 && boundedString(item, 16_384),
    ) ||
    !Number.isFinite(value.elapsedMs) ||
    (value.elapsedMs as number) < 0 ||
    (value.elapsedMs as number) > 86_400_000
  )
    return false;
  if (value.text !== undefined && !boundedString(value.text)) return false;
  return value.data === undefined || isJsonValue(value.data);
}

export function isFrameCommand(
  value: unknown,
  token: string,
  epoch?: number,
): value is HtmlFrameCommand {
  if (!isRecord(value) || !validCommon(value, token, epoch) || typeof value.kind !== "string")
    return false;
  switch (value.kind) {
    case "commit":
      return (
        onlyKeys(value, ["source", "sourceId", "restore", "reset", "theme", "dir"]) &&
        boundedString(value.source) &&
        (value.reset === undefined || typeof value.reset === "boolean") &&
        boundedString(value.sourceId, MAX_REQUEST_ID) &&
        value.sourceId.length > 0 &&
        (value.restore === undefined || isJsonValue(value.restore)) &&
        (value.theme === undefined || isThemeState(value.theme)) &&
        (value.dir === undefined ||
          value.dir === "ltr" ||
          value.dir === "rtl" ||
          value.dir === "auto")
      );
    case "reset":
    case "snapshot":
    case "dispose":
      return onlyKeys(value, []);
    case "theme":
      return (
        onlyKeys(value, ["theme", "dir"]) &&
        isThemeState(value.theme) &&
        (value.dir === undefined ||
          value.dir === "ltr" ||
          value.dir === "rtl" ||
          value.dir === "auto")
      );
    case "shared-state":
      return onlyKeys(value, ["shared"]) && isRecord(value.shared) && isJsonValue(value.shared);
    case "api-result":
      return (
        onlyKeys(value, ["result", "error"]) &&
        ((isNetworkResult(value.result) && value.error === undefined) ||
          (value.result === undefined && isSerializedError(value.error)))
      );
    default:
      return false;
  }
}

export function isRunnerMessage(
  value: unknown,
  token: string,
  epoch?: number,
): value is HtmlRunnerMessage {
  if (!isRecord(value) || !validCommon(value, token, epoch) || typeof value.kind !== "string")
    return false;
  switch (value.kind) {
    case "ready":
      return (
        onlyKeys(value, ["ok"]) &&
        value.requestId === "ready" &&
        value.revision === 0 &&
        value.ok === true
      );
    case "result":
      return (
        onlyKeys(value, ["ok", "result", "error"]) &&
        (value.ok === true
          ? value.result === undefined || isJsonValue(value.result)
          : value.ok === false && isSerializedError(value.error))
      );
    case "error":
      return onlyKeys(value, ["error"]) && isSerializedError(value.error);
    case "height":
      return (
        onlyKeys(value, ["height"]) &&
        value.requestId === "height" &&
        Number.isFinite(value.height) &&
        (value.height as number) >= 0 &&
        (value.height as number) <= MAX_HEIGHT
      );
    case "state":
      return (
        onlyKeys(value, ["sourceId", "state"]) &&
        value.requestId === "state" &&
        boundedString(value.sourceId, MAX_REQUEST_ID) &&
        value.sourceId.length > 0 &&
        isJsonValue(value.state)
      );
    case "shared-set":
      return (
        onlyKeys(value, ["key", "value"]) && isSharedKey(value.key) && isJsonValue(value.value)
      );
    case "api-fetch":
      return (
        onlyKeys(value, ["url", "options"]) &&
        boundedString(value.url, 16_384) &&
        value.url.length > 0 &&
        isNetworkOptions(value.options)
      );
    default:
      return false;
  }
}

export function serializedError(error: unknown): SerializedError {
  const name = error instanceof Error ? error.name : "Error";
  const message = error instanceof Error ? error.message : String(error);
  return { name: name.slice(0, 128) || "Error", message: message.slice(0, 16_384) };
}
