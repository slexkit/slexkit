<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { Compartment } from "@codemirror/state";
  import { EditorView, type ViewUpdate } from "@codemirror/view";
  import type { Extension, Transaction } from "@codemirror/state";

  type Props = {
    doc?: string;
    extensions?: Extension;
    class?: string;
    onChange?: (value: string, view: EditorView, transactions: readonly Transaction[]) => void;
    onEditorView?: (view: EditorView) => void;
  };

  let {
    doc = "",
    extensions = [],
    class: className = "",
    onChange,
    onEditorView,
  }: Props = $props();

  let dom: HTMLDivElement;
  let view: EditorView | null = null;
  let lastDoc = doc;
  let measureFrame = 0;
  const extensionsCompartment = new Compartment();

  function scheduleMeasure() {
    if (!view || measureFrame) return;
    measureFrame = window.requestAnimationFrame(() => {
      measureFrame = 0;
      view?.requestMeasure();
    });
  }

  onMount(() => {
    view = new EditorView({
      doc,
      parent: dom,
      extensions: [
        extensionsCompartment.of(extensions),
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (!update.docChanged || !view) return;
          lastDoc = update.state.doc.toString();
          onChange?.(lastDoc, view, update.transactions);
        }),
      ],
    });
    onEditorView?.(view);
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(dom);
    scheduleMeasure();

    return () => {
      resizeObserver.disconnect();
      if (measureFrame) {
        window.cancelAnimationFrame(measureFrame);
        measureFrame = 0;
      }
    };
  });

  $effect(() => {
    if (!view) return;
    view.dispatch({
      effects: extensionsCompartment.reconfigure(extensions),
    });
    scheduleMeasure();
  });

  $effect(() => {
    if (!view || doc === lastDoc) return;
    lastDoc = doc;
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: doc,
      },
    });
    scheduleMeasure();
  });

  onDestroy(() => {
    view?.destroy();
    view = null;
  });
</script>

<div class={`codemirror ${className}`} bind:this={dom}></div>
