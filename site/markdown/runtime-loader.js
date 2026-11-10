import { withSiteBase } from "../app/site-base.js";
let runtimePromise = null;

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

export function resolveSlexKitSandboxRuntimeUrl() {
  const globalUrl = globalThis.__SLEXKIT_SANDBOX_RUNTIME_URL__;
  if (typeof globalUrl === "string" && globalUrl.trim()) return globalUrl.trim();

  const metaUrl =
    typeof document === "undefined"
      ? ""
      : document.querySelector('meta[name="slexkit-sandbox-runtime-url"]')?.getAttribute("content");
  if (metaUrl?.trim()) return metaUrl.trim();

  return withSiteBase("/slexkit.runtime.js");
}

export function loadSlexKitRuntime() {
  if (!runtimePromise) {
    const runtimeUrl = resolveSlexKitRuntimeUrl();
    runtimePromise = import(runtimeUrl);
  }
  return runtimePromise;
}
