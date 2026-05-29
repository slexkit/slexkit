<script module lang="ts">
  const persistedCollapsedSections: Record<string, boolean> = {};
</script>

<script lang="ts">
  import { onDestroy } from "svelte";
  import Sidebar from "../../node_modules/flowbite-svelte/dist/sidebar/Sidebar.svelte";
  import SidebarButton from "../../node_modules/flowbite-svelte/dist/sidebar/SidebarButton.svelte";
  import SidebarGroup from "../../node_modules/flowbite-svelte/dist/sidebar/SidebarGroup.svelte";
  import SidebarItem from "../../node_modules/flowbite-svelte/dist/sidebar/SidebarItem.svelte";
  import { uiHelpers } from "../../node_modules/flowbite-svelte/dist/uiHelpers.svelte.js";
  import DocRail from "./navigation/DocRail.svelte";
  import Playground from "../../src/components/svelte/tooling/Playground.svelte";
  import { bindPropStore } from "./bindProps";
  import { emit, objects, text } from "./helpers";
  import { getPhosphorIcon } from "../app/icons.js";
  import type { PropValues, SvelteComponentProps } from "./types";

  type DocItem = Record<string, unknown>;
  type DocSubgroup = { id: string; label: string; items: DocItem[] };
  type DocSection = { id: string; key: string; label: string; icon: string; items: DocItem[]; subgroups: DocSubgroup[] };

  let { props, ctx }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  let collapsedSections = $state<Record<string, boolean>>({ ...persistedCollapsedSections });
  const docsSidebarUi = uiHelpers();
  let isDocsSidebarOpen = $state(false);
  const closeDocsSidebar = docsSidebarUi.close;
  let copyFeedback = $state("");
  let copyFeedbackState = $state<"success" | "error">("success");
  let copyFeedbackTimer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => bindPropStore(props, (next) => (p = next)));
  $effect(() => {
    isDocsSidebarOpen = docsSidebarUi.isOpen;
  });
  onDestroy(() => {
    if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer);
  });

  const activeClass = "slex-docs-sidebar-item slex-docs-sidebar-item--active";
  const nonActiveClass = "slex-docs-sidebar-item";

  function labels() {
    const next = p.uiLabels && typeof p.uiLabels === "object" ? p.uiLabels as Record<string, unknown> : {};
    return {
      docsLabel: text(next.docsLabel, "\u6587\u6863"),
      copyPage: text(next.copyPage, "\u590d\u5236\u9875\u9762"),
      viewMarkdown: text(next.viewMarkdown, "\u67e5\u770b Markdown"),
      copiedPage: text(next.copiedPage, "\u5df2\u590d\u5236\u9875\u9762"),
      copyFailed: text(next.copyFailed, "\u590d\u5236\u5931\u8d25"),
      openDocsNavigation: text(next.openDocsNavigation, "\u6253\u5f00\u6587\u6863\u5bfc\u822a"),
      noDocsFound: text(next.noDocsFound, "\u6ca1\u6709\u627e\u5230\u6587\u6863\u3002"),
      onThisPage: text(next.onThisPage, "\u672c\u9875"),
      onThisPageAria: text(next.onThisPageAria, "\u672c\u9875\u76ee\u5f55"),
    };
  }

  function markdownHref(doc: DocItem) {
    const explicitHref = text(doc.markdownHref ?? p.markdownHref);
    if (explicitHref) return explicitHref;
    return `${text(doc.href, "/docs")}.md`;
  }

  function slugId(prefix: string, label: string) {
    return `${prefix}-${label.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-").replace(/^-|-$/g, "") || "items"}`;
  }

  function normalizedSectionKey(value: string) {
    const normalized = value.toLowerCase();
    if (normalized === "guides" || value === "指南") return "guides";
    if (normalized === "components" || value === "组件") return "components";
    if (normalized === "reference" || value === "参考") return "reference";
    if (normalized === "releases" || value === "发布") return "releases";
    if (normalized.includes("api") || value === "API 参考") return "api";
    return normalized || "docs";
  }

  function sectionIcon(key: string, label: string) {
    if (key === "guides") return "lightbulb";
    if (key === "components") return "squares-four";
    if (key === "reference") return "book-open";
    if (key === "releases") return "tag";
    if (key === "api") return "database";
    const normalized = label.toLowerCase();
    if (normalized.includes("guide")) return "lightbulb";
    if (normalized.includes("component")) return "squares-four";
    if (normalized.includes("reference")) return "book-open";
    if (normalized.includes("release")) return "tag";
    if (normalized.includes("api")) return "database";
    return "book-open";
  }

  function buildSubgroups(sectionKey: string, items: DocItem[]) {
    const orderedItems = sectionKey === "components"
      ? [...items].sort((a, b) => text(a.title ?? a.label ?? itemId(a)).localeCompare(text(b.title ?? b.label ?? itemId(b)), "en"))
      : [...items];

    if (sectionKey === "components") {
      return [{
        id: slugId("docs-subgroup", sectionKey),
        label: "",
        items: orderedItems,
      }];
    }

    return [{
      id: slugId("docs-subgroup", sectionKey),
      label: "",
      items: orderedItems,
    }];
  }

  function sections() {
    const list: DocSection[] = [];
    const byKey = new Map<string, DocSection>();

    for (const item of objects(p.items)) {
      const label = text(item.group, "Docs");
      const key = normalizedSectionKey(text(item.groupKey, label));
      let section = byKey.get(key);
      if (!section) {
        section = { id: slugId("docs-section", key), key, label, icon: sectionIcon(key, label), items: [], subgroups: [] };
        byKey.set(key, section);
        list.push(section);
      }
      section.items.push(item);
    }

    for (const section of list) section.subgroups = buildSubgroups(section.key, section.items);
    return list;
  }

  function itemId(item: DocItem) {
    return text(item.id ?? item.slug ?? item.href);
  }

  function itemHref(item: DocItem) {
    return text(item.href, item.id ? `/docs/${encodeURIComponent(text(item.id))}` : "/docs");
  }

  function isItemActive(item: DocItem) {
    const active = text(p.active);
    const href = itemHref(item);
    const id = itemId(item);
    return active === href || active === id || active === text(item.slug);
  }

  function isSectionOpen(section: DocSection) {
    if (collapsedSections[section.id] !== undefined) return !collapsedSections[section.id];
    return true;
  }

  function toggleSection(section: DocSection) {
    const next = {
      ...collapsedSections,
      [section.id]: isSectionOpen(section),
    };
    collapsedSections = next;
    Object.assign(persistedCollapsedSections, next);
  }

  async function copyText(value: unknown) {
    const content = text(value);
    if (!content) throw new Error("Nothing to copy.");
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = content;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function showCopyFeedback(message: string, state: "success" | "error") {
    copyFeedback = message;
    copyFeedbackState = state;
    if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer);
    copyFeedbackTimer = setTimeout(() => {
      copyFeedback = "";
      copyFeedbackTimer = undefined;
    }, 1800);
  }

  async function copyMarkdown(doc: DocItem) {
    try {
      const markdown = text(doc.markdown);
      if (markdown) {
        await copyText(markdown);
        showCopyFeedback(labels().copiedPage, "success");
        return;
      }

      const href = markdownHref(doc);
      if (!href) throw new Error("Missing Markdown URL.");
      const response = await fetch(href);
      if (!response.ok) throw new Error(`Failed to load Markdown: ${response.status}`);
      await copyText(await response.text());
      showCopyFeedback(labels().copiedPage, "success");
    } catch {
      showCopyFeedback(labels().copyFailed, "error");
    }
  }
</script>

<section class="slex-docs-shell">
  <aside class="slex-docs-shell-sidebar">
    <Sidebar
      activeUrl={text(p.active)}
      isOpen={isDocsSidebarOpen}
      closeSidebar={closeDocsSidebar}
      breakpoint="lg"
      backdrop
      position="fixed"
      class="slex-docs-flowbite-sidebar h-full w-full bg-transparent p-0"
      classes={{ active: activeClass, nonactive: nonActiveClass }}
      ariaLabel={text(p.label, labels().docsLabel)}
    >
      {#each sections() as section}
        <SidebarGroup class="slex-docs-section">
          <button
            type="button"
            class="slex-docs-section-trigger"
            class:slex-docs-section-trigger--open={isSectionOpen(section)}
            aria-expanded={isSectionOpen(section)}
            aria-controls={`${section.id}-panel`}
            onclick={() => toggleSection(section)}
          >
            <span class="slex-docs-section-trigger-main">
              <span class="slex-docs-section-icon" aria-hidden="true">{@html getPhosphorIcon(section.icon)}</span>
              <span>{section.label}</span>
            </span>
            <span class="slex-docs-section-caret" aria-hidden="true">{@html getPhosphorIcon("caret-down")}</span>
          </button>
          <div
            id={`${section.id}-panel`}
            class="slex-docs-section-panel"
            class:slex-docs-section-panel--open={isSectionOpen(section)}
            data-state={isSectionOpen(section) ? "open" : "closed"}
            aria-hidden={!isSectionOpen(section)}
          >
            <div class="slex-docs-section-panel-inner">
              {#each section.subgroups as subgroup}
                <div class="slex-docs-subgroup">
                  {#if subgroup.label}<div class="slex-docs-subgroup-title">{subgroup.label}</div>{/if}
                  <div class="slex-docs-subgroup-items">
                    {#each subgroup.items as item}
                      <SidebarItem
                        label={text(item.title ?? item.label ?? itemId(item))}
                        href={itemHref(item)}
                        title={text(item.description ?? item.summary ?? item.title)}
                        active={isItemActive(item)}
                        {activeClass}
                        nonActiveClass={nonActiveClass}
                        spanClass="slex-docs-sidebar-item-label"
                        onclick={(event) => {
                          if (p.preventDefault === true) event.preventDefault();
                          emit(ctx, "select", { type: "select", target: ctx.id, id: itemId(item), href: itemHref(item), item, native: event });
                          closeDocsSidebar();
                        }}
                      />
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </SidebarGroup>
      {/each}
    </Sidebar>
  </aside>

  <article class="slex-docs-shell-main">
    <div class="slex-docs-mobile-toolbar">
      <SidebarButton
        breakpoint="lg"
        class="slex-site-icon-button slex-docs-sidebar-trigger"
        onclick={docsSidebarUi.toggle}
        aria-label={labels().openDocsNavigation}
        title={labels().openDocsNavigation}
      />
    </div>

    {#if p.playground && typeof p.playground === "object"}
      <div class="slex-docs-shell-playground">
        <Playground componentName="playground" {ctx} props={{ subscribe: (run) => { run(p.playground as Record<string, unknown>); return () => {}; } }} />
      </div>
    {/if}
    {#if p.doc && typeof p.doc === "object"}
      {@const doc = p.doc as DocItem}
      <article class="slex-doc-detail">
        <div class="slex-doc-detail-content">
          <div class="slex-doc-detail-header">
            <div class="slex-doc-detail-actions slex-doc-detail-actions--content" aria-label={labels().docsLabel}>
              <span class="slex-doc-detail-copy-action">
                <button type="button" class="slex-doc-detail-action" title={labels().copyPage} onclick={() => copyMarkdown(doc)}>
                  <span class="slex-doc-detail-action-icon" aria-hidden="true">{@html getPhosphorIcon("copy")}</span>{labels().copyPage}
                </button>
                <span class="slex-doc-detail-copy-feedback" data-state={copyFeedbackState} aria-live="polite">{copyFeedback}</span>
              </span>
              <a class="slex-doc-detail-action" title={labels().viewMarkdown} href={markdownHref(doc)} target="_blank" rel="noreferrer">
                <span class="slex-doc-detail-action-icon" aria-hidden="true">{@html getPhosphorIcon("markdown-logo")}</span>Markdown
              </a>
            </div>
          </div>
          <div class="slex-doc-prose">{@html text(doc.bodyHtml ?? doc.html)}</div>
        </div>
      </article>
    {:else}
      <div class="slex-docs-shell-empty">{text(p.emptyText, labels().noDocsFound)}</div>
    {/if}
  </article>

  {#if p.doc && typeof p.doc === "object"}
    {@const doc = p.doc as DocItem}
    {@const railProps = {
      items: doc.toc,
      markdownHref: markdownHref(doc),
      label: labels().onThisPage,
      ariaLabel: labels().onThisPageAria,
      actionsLabel: labels().docsLabel,
      copyLabel: labels().copyPage,
      viewMarkdownLabel: labels().viewMarkdown,
      markdownLabel: "Markdown",
      copyFeedback,
      copyFeedbackState,
      onCopy: () => copyMarkdown(doc),
    }}
    <DocRail class="slex-docs-shell-rail" componentName="doc-rail" {ctx} props={{ subscribe: (run) => { run(railProps); return () => {}; } }} />
  {/if}
</section>
