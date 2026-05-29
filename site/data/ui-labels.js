import enUS from "../i18n/ui/en-US.json" with { type: "json" };
import zhCN from "../i18n/ui/zh-CN.json" with { type: "json" };
import { defaultLocale, normalizeLocale } from "./locales.js";

const labelsByLocale = {
  "en-US": enUS,
  "zh-CN": zhCN,
};

export function siteUiLabelsForLocale(locale = defaultLocale) {
  return labelsByLocale[normalizeLocale(locale)] ?? labelsByLocale[defaultLocale];
}
