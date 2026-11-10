export function selectPackages(raw, available) {
  const requested = String(raw ?? "").split(",").map((name) => name.trim()).filter(Boolean);
  const selected = new Set(requested.length ? requested : available);
  for (const name of selected) {
    if (!available.includes(name)) throw new Error(`Unknown npm package: ${name}`);
  }
  return selected;
}
