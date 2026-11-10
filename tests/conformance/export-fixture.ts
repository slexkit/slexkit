import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { htmlCalculator, nativeHtmlFixture } from "./html-fixtures";

const destination = resolve(process.argv[2] ?? "test-results/html-migration/fixture");
await mkdir(destination, { recursive: true });
const sources = [htmlCalculator, nativeHtmlFixture];
const revisedSources = [
  htmlCalculator
    .replace('title="功率计算器"', 'title="Updated"')
    .replace('value="12"', 'value="24"'),
  nativeHtmlFixture.replace("Native HTML and SVG", "Updated native content"),
];
const operations = [
  "engineering input and derived result",
  "invalid input",
  "changed default preserves modified input",
  "focus and selection preservation",
  "explicit reset applies latest defaults",
  "native HTML and SVG update",
  "snapshot and disposal",
];
const markdown = `# HTML cross-host conformance

The same standard HTML fragment is used by the current web, Streamdown, Assistant UI, Tiptap and Playground adapters.

${sources.map((source) => `\`\`\`slex\n${source}\n\`\`\``).join("\n\n")}

Readable result: 24 W.
`;
await writeFile(resolve(destination, "Cross-host conformance.md"), markdown);
await writeFile(
  resolve(destination, "fixture.json"),
  `${JSON.stringify(
    {
      format: "html-fragment",
      sources,
      revisedSources,
      operations,
      sourceSha256: sources.map((source) => createHash("sha256").update(source).digest("hex")),
    },
    null,
    2,
  )}\n`,
);
console.log(destination);
