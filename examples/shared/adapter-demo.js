export const adapterDemoTitle = "RC Low-Pass Filter";
export const adapterDemoSourceUrl = "/official-examples/rc-low-pass-filter/en-US.md";

export function stripFrontmatter(markdown) {
  return markdown.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
}

export async function loadAdapterDemoMarkdown(fetcher = globalThis.fetch) {
  const response = await fetcher(adapterDemoSourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to load ${adapterDemoSourceUrl}: ${response.status}`);
  }

  return `${stripFrontmatter(await response.text()).trim()}\n`;
}

export default loadAdapterDemoMarkdown;
