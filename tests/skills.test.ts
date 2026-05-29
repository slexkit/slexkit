import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";

const skillPaths = [
  "skills/slexkit-author/SKILL.md",
  "skills/slexkit-host-integration/SKILL.md",
  "skills/slexkit-toolhost/SKILL.md",
  "skills/slexkit-secure-runtime/SKILL.md",
];

describe("SlexKit skills", () => {
  it("ships focused skill entrypoints with trigger metadata", async () => {
    for (const path of skillPaths) {
      const source = await readFile(path, "utf-8");
      expect(source.startsWith("---\n")).toBe(true);
      expect(source).toContain("\nname: ");
      expect(source).toContain("\ndescription: ");
      expect(source).toContain("SlexKit");
    }
  });
});
