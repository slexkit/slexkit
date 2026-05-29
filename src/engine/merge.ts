export function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    const srcVal = source[key];
    if (typeof srcVal === "function") {
      target[key] = srcVal;
    } else if (srcVal !== null && typeof srcVal === "object" && !Array.isArray(srcVal)) {
      if (!(key in target) || typeof target[key] !== "object") {
        target[key] = {};
      }
      deepMerge(
        target[key] as Record<string, unknown>,
        srcVal as Record<string, unknown>,
      );
    } else {
      target[key] = srcVal;
    }
  }
  return target;
}
