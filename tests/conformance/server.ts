import { resolve, sep } from "node:path";
import { marked } from "marked";
import { htmlCalculator } from "./html-fixtures";
const root = resolve(import.meta.dir, "../..");
const result = await Bun.build({entrypoints:[resolve(import.meta.dir,"html-adapters-client.tsx")],target:"browser",format:"esm",conditions:["browser"],define:{"process.env.NODE_ENV":JSON.stringify("production"),"import.meta.env.DEV":"false","import.meta.env.PROD":"true"},plugins:[{name:"workspace-conformance",setup(build){
  build.onResolve({filter:/^(react(?:-dom)?(?:\/.*)?|@tiptap\/(?:core|starter-kit))$/},({path})=>({path:Bun.resolveSync(path,resolve(root,path.startsWith("@tiptap/")?"packages/tiptap":"packages/streamdown"))}));
  build.onResolve({filter:/^(slexkit|@slexkit\/streamdown)$/},({path})=>({path:resolve(root,path==="slexkit"?"dist/slexkit.js":"packages/streamdown/dist/index.js")}));
}}]});
if(!result.success) throw new Error(result.logs.map(String).join("\n"));
const client = await result.outputs[0].text();
const server = Bun.serve({hostname:"127.0.0.1",port:Number(process.env.PORT || 0), async fetch(request) {
  const path = new URL(request.url).pathname;
  const headers = {"Access-Control-Allow-Origin":"*","Cache-Control":"no-store"};
  if(path==="/fallback") return new Response(`<!doctype html><html lang="en"><body>${marked.parse('# Portable fallback\n\n~~~slex\n'+htmlCalculator+'\n~~~\n\nReadable result: 24 W.')}</body></html>`,{headers:{...headers,"Content-Type":"text/html"}});
  if(path==="/") return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="/dist/slexkit.css"></head><body><main id="app" style="max-width:760px;margin:24px auto"></main><script type="module" src="/client.js"></script></body></html>',{headers:{...headers,"Content-Type":"text/html"}});
  if(path==="/client.js")return new Response(client,{headers:{...headers,"Content-Type":"text/javascript"}});
  const filePath = resolve(root, path === "/dist/slexkit.runtime.js" ? "dist/slexkit.js" : `.${decodeURIComponent(path)}`);
  if(!filePath.startsWith(root+sep) || !path.startsWith("/dist/"))return new Response("Not found",{status:404,headers});
  const file=Bun.file(filePath);if(!await file.exists())return new Response("Not found",{status:404,headers});
  return new Response(file,{headers:{...headers,"Content-Type":path.endsWith(".js")?"text/javascript":file.type}});
}});
console.log(JSON.stringify({url:`http://127.0.0.1:${server.port}`}));
