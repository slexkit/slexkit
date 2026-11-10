import { expect, test } from "bun:test";
import { selectPackages } from "../../scripts/npm-publish-selection.mjs";

test("npm publication selects known packages and rejects typos", () => {
  const names = ["slexkit", "@slexkit/mcp", "@slexkit/tiptap"];
  expect([...selectPackages(undefined, names)]).toEqual(names);
  expect([...selectPackages(" @slexkit/mcp, @slexkit/tiptap ", names)]).toEqual(names.slice(1));
  expect(() => selectPackages("@slexkit/unknown", names)).toThrow("Unknown npm package");
});
