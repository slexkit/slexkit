export const defaultLocale = "en-US";
export const sourceLocale = "en-US";
export const supportedLocales = ["en-US", "zh-CN"];

export function normalizeLocale(locale) {
  return supportedLocales.includes(locale) ? locale : defaultLocale;
}

export function localePrefix(locale) {
  return normalizeLocale(locale) === defaultLocale ? "" : `/${normalizeLocale(locale)}`;
}

export function docsHref(locale, path) {
  return `${localePrefix(locale)}${path}`;
}
