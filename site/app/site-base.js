export function normalizeSiteBase(value = "/") {
  const raw = String(value || "/").trim();
  if (!raw || raw === "/") return "/";
  return `/${raw.replace(/^\/+|\/+$/g, "")}/`;
}

export function resolveSiteBase() {
  const globalBase = globalThis.__SLEXKIT_SITE_BASE__;
  if (typeof globalBase === "string") return normalizeSiteBase(globalBase);

  const metaBase =
    typeof document === "undefined"
      ? ""
      : document.querySelector('meta[name="slexkit-site-base"]')?.getAttribute("content");
  return normalizeSiteBase(metaBase || "/");
}

export const siteBase = resolveSiteBase();

export function stripSiteBase(pathname, base = siteBase) {
  const normalizedBase = normalizeSiteBase(base);
  const path = String(pathname || "/");
  if (normalizedBase === "/") return path || "/";

  const prefix = normalizedBase.slice(0, -1);
  if (path === prefix) return "/";
  if (path.startsWith(normalizedBase)) return path.slice(prefix.length) || "/";
  return path || "/";
}

export function withSiteBase(path, base = siteBase) {
  const normalizedBase = normalizeSiteBase(base);
  const value = String(path || "/");
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//")) return value;
  if (value.startsWith("#")) return value;
  if (normalizedBase === "/") return value.startsWith("/") ? value : `/${value}`;

  const prefix = normalizedBase.slice(0, -1);
  if (value === prefix || value.startsWith(normalizedBase)) return value;
  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return normalizedPath === "/" ? normalizedBase : `${prefix}${normalizedPath}`;
}

export function siteFetch(path, init) {
  return fetch(withSiteBase(path), init);
}
