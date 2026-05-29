import { flushSync, mount as mountSvelte, unmount } from "svelte";
import Page from "../components/layout/Page.svelte";
import Hero from "../components/content/Hero.svelte";
import Paragraph from "../components/content/Paragraph.svelte";
import List from "../components/content/List.svelte";
import DocProse from "../components/content/DocProse.svelte";
import Heading from "../components/content/Heading.svelte";
import Swatch from "../components/content/Swatch.svelte";
import Diagram from "../components/content/Diagram.svelte";
import Toc from "../components/navigation/Toc.svelte";
import Catalog from "../components/navigation/Catalog.svelte";
import DocRail from "../components/navigation/DocRail.svelte";
import DocsShell from "../components/DocsShell.svelte";

const siteComponents = {
  page: Page,
  hero: Hero,
  paragraph: Paragraph,
  list: List,
  "doc-prose": DocProse,
  heading: Heading,
  swatch: Swatch,
  diagram: Diagram,
  toc: Toc,
  catalog: Catalog,
  "doc-rail": DocRail,
  "docs-shell": DocsShell,
};

const stateModes = {
  heading: "readable",
  paragraph: "readable",
  list: "readable",
  swatch: "readable",
  diagram: "readable",
};

function isReadable(value) {
  return !!value &&
    (typeof value === "object" || typeof value === "function") &&
    typeof value.subscribe === "function";
}

function createPropsStore(props) {
  return {
    subscribe(run) {
      const current = {};
      const cleanups = [];
      let ready = false;

      const emit = () => {
        if (ready) run({ ...current });
      };

      for (const [key, value] of Object.entries(props)) {
        if (key.startsWith("on") && typeof value === "function") continue;
        const propName = key.startsWith("$") ? key.slice(1) : key;
        if (isReadable(value)) {
          cleanups.push(value.subscribe((next) => {
            current[propName] = next;
            emit();
          }));
        } else {
          current[propName] = value;
        }
      }

      ready = true;
      run({ ...current });
      return () => {
        for (const cleanup of cleanups) cleanup();
      };
    },
  };
}

function createSiteSvelteRenderer(type, Component, attachComponentDisposer) {
  return (props, name, ctx) => {
    const host = (ctx.document || document).createElement("div");
    const instance = mountSvelte(Component, {
      target: host,
      props: {
        componentName: name,
        ctx,
        props: createPropsStore(props),
      },
    });
    flushSync();
    const root = host.firstElementChild;
    if (!root) {
      void unmount(instance);
      return undefined;
    }
    root.remove();
    attachComponentDisposer(root, () => {
      void unmount(instance);
    });
    return root;
  };
}

export function registerSiteComponents({ register, attachComponentDisposer }) {
  for (const [type, component] of Object.entries(siteComponents)) {
    register(type, createSiteSvelteRenderer(type, component, attachComponentDisposer), { state: stateModes[type] ?? "none" });
  }
}
