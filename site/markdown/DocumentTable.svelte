<script lang="ts">
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";

  type Props = {
    children?: Snippet;
  };

  const { children }: Props = $props();

  const IDENTIFIER_HEADERS = new Set([
    "field",
    "property",
    "attribute",
    "propertyattribute",
    "property属性",
    "propertyattribute属性",
    "field字段",
    "attribute属性",
    "字段",
    "属性",
    "特性",
    "属性特性",
  ]);
  const DESCRIPTION_HEADERS = new Set(["description", "description描述", "description说明", "描述", "说明"]);

  let scrollContainer: HTMLDivElement;
  let overflowing = $state(false);
  let regionLabel = $state("Scrollable data table");
  let columnWidths = $state<number[]>([]);

  function normalizeHeader(value: string): string {
    return value.trim().toLocaleLowerCase().replace(/[\s/|·_\-—–]+/g, "");
  }

  function localizedRegionLabel(): string {
    const language = scrollContainer.closest("[lang]")?.getAttribute("lang") ?? document.documentElement.lang;
    return language.toLocaleLowerCase().startsWith("zh") ? "可横向滚动的数据表格" : "Scrollable data table";
  }

  function updateTableShape(): void {
    const table = scrollContainer.querySelector<HTMLTableElement>(":scope > table");
    if (!table) return;

    const headers = Array.from(table.querySelectorAll<HTMLTableCellElement>("thead th"));
    headers.forEach((header) => {
      if (!header.hasAttribute("scope")) header.scope = "col";
    });
    const normalizedHeaders = headers.map((header) => normalizeHeader(header.textContent ?? ""));
    const identifierIndex = normalizedHeaders.findIndex((header) => IDENTIFIER_HEADERS.has(header));
    const descriptionIndex = normalizedHeaders.findIndex((header) => DESCRIPTION_HEADERS.has(header));
    const isReferenceTable = identifierIndex >= 0 && descriptionIndex >= 0;

    scrollContainer.dataset.referenceTable = String(isReferenceTable);
    scrollContainer.dataset.columns = String(headers.length);

    table
      .querySelectorAll(".slex-doc-table__identifier, .slex-doc-table__description")
      .forEach((cell) => cell.classList.remove("slex-doc-table__identifier", "slex-doc-table__description"));

    if (isReferenceTable) {
      table.querySelectorAll<HTMLTableRowElement>("tr").forEach((row) => {
        row.children.item(identifierIndex)?.classList.add("slex-doc-table__identifier");
        row.children.item(descriptionIndex)?.classList.add("slex-doc-table__description");
      });
    }

    // At the end of a horizontal scroll, the final description column must fit
    // beside the sticky identifier. Otherwise the sticky cell covers the start
    // of its text. Measure whole code tokens, never split or scale identifiers.
    const available = scrollContainer.clientWidth;
    let plannedWidth: number | undefined;
    if (isReferenceTable && headers.length === 4 && identifierIndex === 0 && descriptionIndex === 3 && available < 576) {
      const rows = Array.from(table.querySelectorAll<HTMLTableRowElement>("tr"));
      const tokenWidth = (cell: Element): number => {
        const style = getComputedStyle(cell);
        const padding = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
        const tokens = Array.from(cell.querySelectorAll("code"));
        if (tokens.length) return Math.max(...tokens.map(token => token.getBoundingClientRect().width)) + padding;
        const range = document.createRange();
        range.selectNodeContents(cell);
        return range.getBoundingClientRect().width + padding;
      };
      const identifier = Math.ceil(Math.max(136, ...rows.slice(1).map(row => tokenWidth(row.children[0]))));
      const defaults = Math.ceil(Math.max(80, ...rows.map(row => tokenWidth(row.children[2]))));
      const canPin = available - identifier >= 160;
      const description = canPin ? available - identifier : 224;
      const next = [identifier, 128, defaults, description];
      plannedWidth = next.reduce((sum, width) => sum + width, 0);
      if (next.some((width, index) => width !== columnWidths[index]) || columnWidths.length !== 4) columnWidths = next;
      scrollContainer.dataset.stickyField = String(canPin);
      scrollContainer.dataset.fittedColumns = "true";
    } else {
      if (columnWidths.length) columnWidths = [];
      scrollContainer.dataset.fittedColumns = "false";
      scrollContainer.dataset.stickyField = String(isReferenceTable);
    }

    regionLabel = localizedRegionLabel();
    // Svelte applies the planned colgroup after this call. Reading only the old
    // DOM would briefly remove keyboard access while the new table is wider.
    overflowing = (plannedWidth ?? scrollContainer.scrollWidth) > available + 1;
  }

  onMount(() => {
    updateTableShape();
    const owner = scrollContainer.ownerDocument.defaultView!;
    let frame: number | undefined;
    let active = true;
    const scheduleUpdate = () => {
      if (!active || frame !== undefined) return;
      frame = owner.requestAnimationFrame(() => {
        frame = undefined;
        if (active) updateTableShape();
      });
    };

    // Updating colgroup widths during observer delivery causes WebKit to report
    // undelivered resize notifications. Coalesce reads/writes outside delivery.
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(scrollContainer);
    const table = scrollContainer.querySelector(":scope > table");
    if (table) resizeObserver.observe(table);

    const mutationObserver = new MutationObserver(scheduleUpdate);
    mutationObserver.observe(scrollContainer, { childList: true, subtree: true, characterData: true });

    return () => {
      active = false;
      if (frame !== undefined) owner.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  });
</script>

<div
  class="slex-doc-table-scroll"
  class:slex-doc-table-scroll--overflowing={overflowing}
  bind:this={scrollContainer}
  role={overflowing ? "region" : undefined}
  aria-label={overflowing ? regionLabel : undefined}
  tabindex={overflowing ? 0 : undefined}
>
  <table class="slex-doc-table" style:width={columnWidths.length ? `${columnWidths.reduce((sum, width) => sum + width, 0)}px` : undefined}>
    {#if columnWidths.length}
      <colgroup>
        {#each columnWidths as width, index (index)}<col style:width={`${width}px`} />{/each}
      </colgroup>
    {/if}
    {@render children?.()}
  </table>
</div>
