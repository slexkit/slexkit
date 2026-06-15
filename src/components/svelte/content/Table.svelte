<script lang="ts">
  import { bindPropStore } from "../bindProps";
  import { readCell, readColumnLabel, readColumns, rows, text } from "../helpers";
  import InlineIcon from "../InlineIcon.svelte";
  import type { PropValues, SvelteComponentProps } from "../types";

  let { props }: SvelteComponentProps = $props();
  let p = $state<PropValues>({});
  $effect(() => bindPropStore(props, (next) => (p = next)));
</script>

<div class="slex-table-wrap">
  <table class="slex-table">
    {#if readColumns(p.columns).length}
      <thead>
        <tr>
          {#each rows(p.columns) as column, index}
            <th scope="col">
              <span class="slex-table-column-label">
                {#if column && typeof column === "object" && "icon" in column}
                  <InlineIcon name={(column as Record<string, unknown>).icon} className="slex-table-column-icon" />
                {/if}
                <span>{readColumnLabel(column, readColumns(p.columns)[index] ?? "")}</span>
              </span>
            </th>
          {/each}
        </tr>
      </thead>
    {/if}
    <tbody>
      {#each rows(p.rows ?? p.items) as row}
        <tr>
          {#if readColumns(p.columns).length}
            {#each readColumns(p.columns) as column, index}<td>{readCell(row, column, index)}</td>{/each}
          {:else if Array.isArray(row)}
            {#each row as cell}<td>{text(cell)}</td>{/each}
          {:else}
            <td>{text(row)}</td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
