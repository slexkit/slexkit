import { withSiteBase } from "../app/site-base.js";
import { registerSiteComponents } from "../app/site-components.js";

let runtimePromise = null;
let toolingPromise = null;
const registeredRuntimeApis = new WeakSet();

function ensureSiteRuntimeComponents(api) {
  if (!api || typeof api !== "object" || registeredRuntimeApis.has(api)) return api;
  if (typeof api.register === "function" && typeof api.attachComponentDisposer === "function") {
    registerSiteComponents({
      register: api.register,
      attachComponentDisposer: api.attachComponentDisposer,
    });
    registeredRuntimeApis.add(api);
  }
  return api;
}

export function resolveSlexKitRuntimeUrl() {
  const globalUrl = globalThis.__SLEXKIT_RUNTIME_URL__;
  if (typeof globalUrl === "string" && globalUrl.trim()) return globalUrl.trim();

  const metaUrl =
    typeof document === "undefined"
      ? ""
      : document.querySelector('meta[name="slexkit-runtime-url"]')?.getAttribute("content");
  if (metaUrl?.trim()) return metaUrl.trim();

  return withSiteBase("/slexkit.js");
}

export function resolveSlexKitToolingUrl() {
  const globalUrl = globalThis.__SLEXKIT_TOOLING_URL__;
  if (typeof globalUrl === "string" && globalUrl.trim()) return globalUrl.trim();

  const metaUrl =
    typeof document === "undefined"
      ? ""
      : document.querySelector('meta[name="slexkit-tooling-url"]')?.getAttribute("content");
  if (metaUrl?.trim()) return metaUrl.trim();

  return withSiteBase("/tooling.js");
}

export function loadSlexKitRuntime() {
  if (!runtimePromise) {
    const runtimeUrl = resolveSlexKitRuntimeUrl();
    runtimePromise = import(runtimeUrl).then(ensureSiteRuntimeComponents);
  }
  return runtimePromise;
}

export function loadSlexKitTooling() {
  if (!toolingPromise) {
    toolingPromise = loadSlexKitRuntime().then(() => import(resolveSlexKitToolingUrl()));
  }
  return toolingPromise;
}
