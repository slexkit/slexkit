// URL fragments stay in the browser and are never sent as HTTP request targets.
export function setPlaygroundSource(url, source) {
  const fragment = new URLSearchParams(url.hash.slice(1));
  fragment.set("source", String(source));
  url.searchParams.delete("source");
  url.searchParams.delete("code");
  url.hash = fragment.toString();
  return url;
}

export function getPlaygroundSource(url) {
  const fragment = new URLSearchParams(url.hash.slice(1));
  return fragment.get("source") ?? url.searchParams.get("source") ?? url.searchParams.get("code");
}
