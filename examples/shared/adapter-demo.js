export const adapterDemoTitle = "RC Low-Pass Filter";
export const adapterDemoSourceUrl = "/official-examples/rc-low-pass-filter/en-US.md";

export function stripFrontmatter(markdown) {
  return markdown.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
}

export async function loadAdapterDemoMarkdown(fetcher = globalThis.fetch) {
  // Both standalone demos and the site bundle live two levels below the site base.
  const sourceUrl = typeof window === "undefined"
    ? adapterDemoSourceUrl
    : new URL("../../official-examples/rc-low-pass-filter/en-US.md", import.meta.url).href;
  const response = await fetcher(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to load ${sourceUrl}: ${response.status}`);
  }

  return `${stripFrontmatter(await response.text()).trim()}\n`;
}

export default loadAdapterDemoMarkdown;
