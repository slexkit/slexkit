import { mount, unmount } from "svelte";
import { writable } from "svelte/store";
import DocsShell from "./DocsShell.svelte";

// Keep the navigation component mounted while the current document changes.
export function mountDocsShell(target, initialValue, id) {
  const props = writable(initialValue);
  const app = mount(DocsShell, {
    target,
    props: { componentName: "docs-shell", props, ctx: { id, emit() {} } },
  });
  return { update: props.set, destroy: () => void unmount(app) };
}
