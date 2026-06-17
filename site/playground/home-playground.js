import { defaultLocale } from "../data/component-docs.js";
import enUSSource from "../examples/home-rc-filter/example.en-US.slex.js";
import zhCNSource from "../examples/home-rc-filter/example.zh-cn.slex.js";

const homeRcFilterExamples = {
  "zh-CN": zhCNSource,
  "en-US": enUSSource,
};

export function homePlaygroundSource(locale = defaultLocale) {
  return homeRcFilterExamples[locale] ?? homeRcFilterExamples[defaultLocale];
}

export const defaultPlaygroundSource = homePlaygroundSource(defaultLocale);

export function homePlaygroundConfig(locale = defaultLocale) {
  return {
    title: "Playground",
    class: "slex-home-playground",
    mode: "render",
    previewAlign: "center",
    previewMinHeight: "0px",
    sourceType: "markdown",
    source: homePlaygroundSource(locale),
  };
}
