export type SlexKitStdlibFunctionDoc = {
  name: string;
  signature: string;
  summary: string;
  pure: true;
  example: string;
};

export type SlexKitStdlibNamespaceDoc = {
  name: "math" | "stats" | "format" | "units";
  summary: string;
  functions: SlexKitStdlibFunctionDoc[];
};

export type SlexKitRuntimeCapabilityDoc = {
  name: string;
  policy: "network" | "timer" | "animation" | "canvas" | "lifecycle" | "diagnostics";
  signature: string;
  summary: string;
  example: string;
  secureDefault: "denied" | "available";
  forbidden?: string[];
};

export const slexkitExpressionContext = [
  { name: "g", scope: "always", summary: "Reactive state proxy." },
  { name: "std", scope: "always", summary: "Pure deterministic SlexKit standard library." },
  { name: "api", scope: "host-injected", summary: "Host or secure runtime capability object." },
  { name: "$event", scope: "event handlers", summary: "Event payload for on* handlers." },
  { name: "$item", scope: "$for", summary: "Current array item." },
  { name: "$index", scope: "$for", summary: "Current item index." },
  { name: "$key", scope: "$for", summary: "Current item key." },
] as const;

export const slexkitStdlibDocs: SlexKitStdlibNamespaceDoc[] = [
  {
    name: "math",
    summary: "Small numeric helpers for common interactive calculations.",
    functions: [
      { name: "std.math.clamp", signature: "clamp(value, min, max)", summary: "Clamp a number into a range.", pure: true, example: "std.math.clamp(g.score, 0, 100)" },
      { name: "std.math.round", signature: "round(value, digits = 0)", summary: "Round with a fixed number of decimal digits.", pure: true, example: "std.math.round(g.latency, 1)" },
      { name: "std.math.safeDivide", signature: "safeDivide(numerator, denominator, fallback = 0)", summary: "Divide with a fallback for zero or invalid denominators.", pure: true, example: "std.math.safeDivide(g.used, g.total, 0)" },
      { name: "std.math.percent", signature: "percent(part, total, digits = 1)", summary: "Return part / total as a percentage number.", pure: true, example: "std.math.percent(g.done, g.total, 1)" },
      { name: "std.math.lerp", signature: "lerp(start, end, t)", summary: "Linear interpolation.", pure: true, example: "std.math.lerp(0, 100, g.progress)" },
    ],
  },
  {
    name: "stats",
    summary: "Finite-number aggregations for arrays.",
    functions: [
      { name: "std.stats.sum", signature: "sum(values)", summary: "Sum finite numeric values. Empty arrays return 0.", pure: true, example: "std.stats.sum(g.samples)" },
      { name: "std.stats.mean", signature: "mean(values)", summary: "Average finite numeric values. Empty arrays return NaN.", pure: true, example: "std.stats.mean(g.samples)" },
      { name: "std.stats.min", signature: "min(values)", summary: "Minimum finite numeric value. Empty arrays return NaN.", pure: true, example: "std.stats.min(g.samples)" },
      { name: "std.stats.max", signature: "max(values)", summary: "Maximum finite numeric value. Empty arrays return NaN.", pure: true, example: "std.stats.max(g.samples)" },
      { name: "std.stats.median", signature: "median(values)", summary: "Median finite numeric value. Empty arrays return NaN.", pure: true, example: "std.stats.median(g.samples)" },
    ],
  },
  {
    name: "format",
    summary: "Deterministic display formatting with en-US defaults.",
    functions: [
      { name: "std.format.fixed", signature: "fixed(value, digits = 2)", summary: "Format a number with fixed decimal places.", pure: true, example: "std.format.fixed(g.voltage, 3)" },
      { name: "std.format.number", signature: "number(value, digits = 0, locale = 'en-US')", summary: "Locale number formatting.", pure: true, example: "std.format.number(g.requests)" },
      { name: "std.format.compact", signature: "compact(value, digits = 1, locale = 'en-US')", summary: "Compact number formatting.", pure: true, example: "std.format.compact(g.users)" },
      { name: "std.format.percent", signature: "percent(ratio, digits = 1)", summary: "Format a ratio as a percentage string.", pure: true, example: "std.format.percent(g.done / g.total, 1)" },
      { name: "std.format.currency", signature: "currency(value, currency = 'USD', locale = 'en-US')", summary: "Format a currency value.", pure: true, example: "std.format.currency(g.revenue, 'USD')" },
    ],
  },
  {
    name: "units",
    summary: "Small unit display helpers for common dashboards.",
    functions: [
      { name: "std.units.withUnit", signature: "withUnit(value, unit, digits = 2)", summary: "Format a value with a unit suffix.", pure: true, example: "std.units.withUnit(g.power, 'W', 1)" },
      { name: "std.units.bytes", signature: "bytes(value, digits = 1)", summary: "Format bytes as B, KB, MB, GB, TB, or PB.", pure: true, example: "std.units.bytes(g.payloadBytes)" },
      { name: "std.units.duration", signature: "duration(ms, digits = 1)", summary: "Format milliseconds as ms, s, min, or h.", pure: true, example: "std.units.duration(g.elapsedMs)" },
      { name: "std.units.si", signature: "si(value, unit = '', digits = 2)", summary: "Format with SI prefixes.", pure: true, example: "std.units.si(g.frequency, 'Hz', 2)" },
    ],
  },
];

export const slexkitRuntimeCapabilities: SlexKitRuntimeCapabilityDoc[] = [
  { name: "api.get", policy: "network", signature: "get(url, options)", summary: "Policy-gated GET request.", example: "await api.get('https://api.example.com/status')", secureDefault: "denied", forbidden: ["fetch(url)", "XMLHttpRequest", "WebSocket"] },
  { name: "api.post", policy: "network", signature: "post(url, body, options)", summary: "Policy-gated POST request.", example: "await api.post('https://api.example.com/items', { ok: true })", secureDefault: "denied", forbidden: ["fetch(url)", "XMLHttpRequest", "WebSocket"] },
  { name: "api.fetch", policy: "network", signature: "fetch(url, options)", summary: "Policy-gated GET or POST request.", example: "await api.fetch(url, { method: 'GET' })", secureDefault: "denied", forbidden: ["fetch(url)", "XMLHttpRequest", "WebSocket"] },
  { name: "api.setTimeout", policy: "timer", signature: "setTimeout(fn, ms)", summary: "Policy-gated timeout.", example: "api.setTimeout(function () { g.ready = true; }, 500)", secureDefault: "denied", forbidden: ["setTimeout(fn, ms)"] },
  { name: "api.clearTimeout", policy: "timer", signature: "clearTimeout(id)", summary: "Clear a policy-gated timeout.", example: "api.clearTimeout(g.timeoutId)", secureDefault: "denied" },
  { name: "api.setInterval", policy: "timer", signature: "setInterval(fn, ms)", summary: "Policy-gated interval.", example: "api.setInterval(function () { g.ticks += 1; }, 1000)", secureDefault: "denied", forbidden: ["setInterval(fn, ms)"] },
  { name: "api.clearInterval", policy: "timer", signature: "clearInterval(id)", summary: "Clear a policy-gated interval.", example: "api.clearInterval(g.intervalId)", secureDefault: "denied" },
  { name: "api.raf", policy: "animation", signature: "raf(fn)", summary: "Policy-gated animation frame.", example: "api.raf(function (time) { g.time = time; })", secureDefault: "denied", forbidden: ["requestAnimationFrame(fn)"] },
  { name: "api.cancelRaf", policy: "animation", signature: "cancelRaf(id)", summary: "Cancel a policy-gated animation frame.", example: "api.cancelRaf(g.rafId)", secureDefault: "denied" },
  { name: "api.createCanvas", policy: "canvas", signature: "createCanvas(width, height)", summary: "Create a policy-counted canvas.", example: "var canvas = api.createCanvas(320, 180)", secureDefault: "denied" },
  { name: "api.getCanvasContext", policy: "canvas", signature: "getCanvasContext(canvas, contextId, options)", summary: "Get a policy-checked canvas context.", example: "var ctx = api.getCanvasContext(canvas, '2d')", secureDefault: "denied" },
  { name: "api.onDispose", policy: "lifecycle", signature: "onDispose(fn)", summary: "Register runtime cleanup.", example: "api.onDispose(function () { g.closed = true; })", secureDefault: "available" },
  { name: "api.now", policy: "lifecycle", signature: "now()", summary: "Runtime clock.", example: "api.now()", secureDefault: "available" },
  { name: "api.isTimeoutError", policy: "diagnostics", signature: "isTimeoutError(error)", summary: "Check timeout errors.", example: "api.isTimeoutError(error)", secureDefault: "available" },
  { name: "api.isNetworkError", policy: "diagnostics", signature: "isNetworkError(error)", summary: "Check network errors.", example: "api.isNetworkError(error)", secureDefault: "available" },
  { name: "api.isPolicyError", policy: "diagnostics", signature: "isPolicyError(error)", summary: "Check policy errors.", example: "api.isPolicyError(error)", secureDefault: "available" },
  { name: "api.errorMessage", policy: "diagnostics", signature: "errorMessage(error)", summary: "Extract a displayable error message.", example: "api.errorMessage(error)", secureDefault: "available" },
];

export const slexkitStdlibFunctionNames = slexkitStdlibDocs.flatMap((namespace) =>
  namespace.functions.map((fn) => fn.name),
);

export const slexkitRuntimeCapabilityNames = slexkitRuntimeCapabilities.map((capability) => capability.name);
