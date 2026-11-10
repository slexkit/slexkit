import { createHash } from "node:crypto";
import { readFile, mkdir, copyFile, writeFile } from "node:fs/promises";
import { resolve, join, relative, sep } from "node:path";

const root=resolve(import.meta.dir,".."), plugin=resolve(root,"../obsidian-slexkit");
const candidate=resolve(root,process.env.SLEXKIT_CANDIDATE_DIR ?? "test-results/html-candidate");
const archive=join(candidate,"slexkit-0.5.0.tgz");
const bytes=await readFile(archive), sha256=createHash("sha256").update(bytes).digest("hex");
const dependencies=join(candidate,"dependencies");
await mkdir(dependencies,{recursive:true});
// Bun caches local archives by path/version. A content-addressed path prevents
// an older 0.5.0 candidate from silently being embedded after a rebuild.
const pinned=join(dependencies,`slexkit-0.5.0-${sha256}.tgz`);
await copyFile(archive,pinned);
const packagePath=join(plugin,"package.json");
const metadata=JSON.parse(await readFile(packagePath,"utf8"));
if(metadata.version!=="0.5.0"||metadata.peerDependencies?.slexkit!=="0.5.0") throw new Error("Obsidian candidate version mismatch");
metadata.devDependencies.slexkit=`file:${relative(plugin,pinned).split(sep).join("/")}`;
await writeFile(packagePath,JSON.stringify(metadata,null,2)+"\n");
await writeFile(join(dependencies,"runtime-pin.json"),JSON.stringify({version:"0.5.0",sha256,archive:relative(root,pinned).split(sep).join("/"),devDependency:metadata.devDependencies.slexkit},null,2)+"\n");
console.log(JSON.stringify({version:"0.5.0",sha256,dependency:metadata.devDependencies.slexkit}));
