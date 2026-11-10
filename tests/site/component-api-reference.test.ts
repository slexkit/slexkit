import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import { describeSlexElements } from "../../src/web-components/definitions";
import { componentApiMetadata } from "../../site/data/component-api";
import { componentApiReference, playgroundApiDescriptor, replaceComponentApiReference } from "../../site/data/component-api-docs";

const elements = [...describeSlexElements(), playgroundApiDescriptor];
const codeFences = (source: string) => [...source.matchAll(/```[\s\S]*?```/g)].map(match => match[0]);

describe("component API documentation", () => {
  it("covers every registered property without publishing internal-only aliases", () => {
    for (const element of elements.filter(element => element.tagName !== "slex-input")) {
      const slug = element.tagName.slice(5);
      const expected = element.properties.map(property => property.name);
      if (slug === "slider") expected.push("valueAsNumber");
      expect(Object.keys(componentApiMetadata[slug]).sort(), slug).toEqual(expected.sort());
      for (const field of Object.values(componentApiMetadata[slug])) {
        expect(field.en.length).toBeGreaterThan(8);
        expect(field.zh).toMatch(/[\u4e00-\u9fff]/);
        expect(field.default).toBeDefined();
      }
    }
  });

  it("keeps generated bilingual references in sync and preserves examples", async () => {
    for (const element of elements) for (const locale of ["en-US", "zh-CN"]) {
      const slug = element.tagName.slice(5);
      const source = await readFile(`site/content/components/${slug}/${locale}.md`, "utf8");
      const updated = replaceComponentApiReference(source, element, locale);
      expect(updated, `${slug}/${locale}`).toBe(source);
      expect(codeFences(updated)).toEqual(codeFences(source));
      expect(source).toContain(locale === "zh-CN" ? "## API 参考" : "## API Reference");
      expect(source).toContain(locale === "zh-CN" ? "| Property / 属性 | 类型 | 默认值 | 说明 |" : "| Property / attribute | Type | Default | Description |");
      const heading = locale === "zh-CN" ? "API 参考" : "API Reference";
      const section = source.split(`## ${heading}\n`)[1].split(/^## /m)[0];
      for (const property of element.properties) expect(section).toContain(`\`${property.name}\``);
    }
  });

  it("updates references without discarding adjacent user-authored sections", () => {
    const element = elements.find(element => element.tagName === "slex-card")!;
    const source = "# Card\n\n```slex\n<slex-card>Retain me</slex-card>\n```\n\n## API Reference\n\nOld reference.\n\n## Notes\n\nCustom notes.\n";
    const next = replaceComponentApiReference(source, element, "en-US");
    expect(next).not.toContain("Old reference.");
    expect(next).toContain("## Notes\n\nCustom notes.");
    expect(codeFences(next)).toEqual(codeFences(source));
    expect(replaceComponentApiReference(next, element, "en-US")).toBe(next);
  });

  it("documents Column's actual slot instead of inventing properties", () => {
    const element = elements.find(element => element.tagName === "slex-column")!;
    const reference = componentApiReference(element, "en-US");
    expect(element.properties).toHaveLength(0);
    expect(reference).toContain("`default` (slot)");
    expect(reference).toContain("no component-specific properties");
    expect(reference).not.toContain("`gap`");
  });

  it("fails closed when a new registered field has no reviewed documentation", () => {
    const element = elements.find(element => element.tagName === "slex-card")!;
    const changed = {...element, properties: [...element.properties, {name:"futureProperty",attribute:"future-property",type:"string"}]};
    expect(() => componentApiReference(changed, "en-US")).toThrow("incomplete API documentation");
  });
});
