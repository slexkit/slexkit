import { join } from "node:path";
import { sveltePlugin } from "./svelte-plugin";
import { publicBuildEntry } from "./public-entry";
import { writeFile } from "node:fs/promises";
const root = join(import.meta.dir, "..");
for (const [entry, output] of [["src/index.ts", "slexkit.js"], ["src/runtime.ts", "runtime.js"], ["src/web-components.ts", "web-components.js"]]) {
  const result = await Bun.build({
    entrypoints: [entry === "src/web-components.ts" ? join(root, entry) : await publicBuildEntry(root, output)], outfile: join(root, "dist", output),
    target: "browser", format: "esm", bundle: true, write: true,
    plugins: [sveltePlugin()],
    define: { "process.env.NODE_ENV": '"production"', "import.meta.env.DEV": "false", "import.meta.env.PROD": "true" },
  });
  if (!result.success) throw new Error(result.logs.map(String).join("\n"));
  const artifact = result.outputs.find(item => item.kind === "entry-point") ?? result.outputs[0];
  await writeFile(join(root, "dist", output), await artifact.arrayBuffer());
  console.log(`${output}: ${result.outputs[0]?.size} bytes`);
}
