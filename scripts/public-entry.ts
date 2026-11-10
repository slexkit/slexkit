import ts from "typescript";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname, resolve, relative } from "node:path";

/** Bun 1.3 can emit undefined bindings for chained re-exports. Materialize the
 * public namespace at the build boundary; do not alter the source API. */
export async function publicBuildEntry(root: string, name: string, entrypoint = "src/index.ts"): Promise<string> {
  const seen = new Set<string>();
  const collect = async (filename: string): Promise<Set<string>> => {
    if (seen.has(filename)) return new Set();
    seen.add(filename);
    const ast = ts.createSourceFile(filename, await readFile(filename, "utf8"), ts.ScriptTarget.Latest, true);
    const names = new Set<string>();
    for (const statement of ast.statements) {
      if (ts.isExportDeclaration(statement) && !statement.isTypeOnly) {
        if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
          for (const item of statement.exportClause.elements) if (!item.isTypeOnly) names.add(item.name.text);
        } else if (!statement.exportClause && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text.startsWith(".")) {
          const path = resolve(dirname(filename), statement.moduleSpecifier.text);
          for (const key of await collect(path.endsWith(".ts") ? path : path + ".ts")) names.add(key);
        }
      } else if (ts.canHaveModifiers(statement) && ts.getModifiers(statement)?.some(item => item.kind === ts.SyntaxKind.ExportKeyword)) {
        if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) { if (statement.name) names.add(statement.name.text); }
        else if (ts.isVariableStatement(statement)) for (const item of statement.declarationList.declarations) if (ts.isIdentifier(item.name)) names.add(item.name.text);
      }
    }
    return names;
  };
  const names = await collect(join(root, entrypoint));
  const target = join(root, "dist", ".tmp", `public-${name}.ts`);
  await mkdir(join(root, "dist", ".tmp"), { recursive: true });
  await writeFile(target, [
    `import * as namespace from ${JSON.stringify(relative(dirname(target), join(root, entrypoint)).replaceAll("\\", "/"))};`,
    'const api = Object.create(null);',
    'for (const key of Reflect.ownKeys(namespace)) api[key] = Reflect.get(namespace, key);',
    ...[...names].map((key) => `export const ${key} = api[${JSON.stringify(key)}];`),
    "",
  ].join("\n"));
  return target;
}
