import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,firefox,webkit} from 'playwright';

const phase=process.argv[2]||'after';
const output=resolve('test-results/stat-overflow-review',phase);
await mkdir(output,{recursive:true});
const samples=[
 ['pi',Math.PI,'V'],['floating',0.1+0.2,'W'],['large',123456789.123456,'Hz'],['negative',-123456789.123456,'A'],
 ['tiny',1.23456789e-17,'F'],['huge',1.23456789e27,'Ω'],['fixed','1.000','ms'],['decimal-string','0.123456789123456789','V'],
 ['identifier','9007199254740993123456789',''],['status','Waiting for a very long measurement description',''],
 ['nan',NaN,'V'],['infinity',Infinity,'Ω'],['negative-infinity',-Infinity,'Ω'],['long-unit',Math.PI,'milliseconds'],
];
const server=spawn('bun',['examples/dev-server.mjs','web-components'],{cwd:process.cwd(),env:{...process.env,PORT:'4220'},windowsHide:true,stdio:'ignore'});
const base='http://127.0.0.1:4220';
const fingerprints=async()=>Object.fromEntries(await Promise.all(['dist/web-components.js','dist/slexkit.css','tests/conformance/stat-value-layout.mjs'].map(async file=>[file,createHash('sha256').update(await readFile(file)).digest('hex')])));
const report={phase,date:new Date().toISOString(),artifactHashes:await fingerprints(),samples:[],transitions:[]};
try {
 for(let i=0;i<100;i++){try{if((await fetch(base+'/dist/web-components.js')).ok)break}catch{};if(server.exitCode!==null)throw new Error('Fixture server exited');await new Promise(r=>setTimeout(r,40));}
 const engines=phase==='before'?{chromium}:{chromium,firefox,webkit};
 for(const [name,engine] of Object.entries(engines)) {
  const browser=await engine.launch();
  try {for(const viewport of (phase==='before'?[960]:[960,390]))for(const theme of ['light','dark']) {
   const page=await browser.newPage({viewport:{width:viewport,height:1000},colorScheme:theme,reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base);await page.waitForFunction(()=>!!customElements.get('slex-stat'));
   await page.evaluate(({theme,samples})=>{
    document.documentElement.className=theme;document.documentElement.dataset.theme=theme;
    document.body.replaceChildren();document.body.style.cssText=`margin:16px;background:${theme==='dark'?'#09090b':'#fff'};display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap`;
    samples.forEach(([id,value,unit])=>[128,160,240].forEach(width=>{const host=document.createElement('slex-stat');host.id=`${id}-${width}`;host.label=`${id} / ${width}px`;host.value=value;host.unit=unit;host.style.width=width+'px';document.body.append(host)}));
   },{theme,samples});
   await page.waitForFunction(()=>[...document.querySelectorAll('slex-stat')].every(e=>parseFloat(getComputedStyle(e.shadowRoot.querySelector('.slex-stat-value')).fontSize)>=20));
   await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(180);
   const metrics=await page.evaluate(()=>[...document.querySelectorAll('slex-stat')].map(e=>{
    const root=e.shadowRoot,card=root.querySelector('.slex-stat'),value=root.querySelector('.slex-stat-value'),number=root.querySelector('.slex-stat-number'),unit=root.querySelector('.slex-stat-unit');
    const r=value.getBoundingClientRect(),n=number.getBoundingClientRect(),u=unit?.getBoundingClientRect();
    const rows=[...new Set([...root.querySelectorAll('.slex-stat-character')].map(c=>Math.round(c.getBoundingClientRect().y)))];
    return {id:e.id,hostWidth:e.getBoundingClientRect().width,cardHeight:card.getBoundingClientRect().height,valueHeight:r.height,numberWidth:n.width,fontSize:parseFloat(getComputedStyle(value).fontSize),display:number.textContent,raw:String(e.value),unit:unit?.textContent||'',title:value.title,rows:rows.length,
      numberRight:n.right,valueRight:r.right,unitRight:u?.right,unitTop:u?.top,numberTop:n.top,numberClipped:number.scrollWidth>number.clientWidth+1,cardScroll:card.scrollWidth-card.clientWidth,pageOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth)};
   }));
   for(const m of metrics) {
    const record={browser:name,version:browser.version(),viewport,theme,...m};
    record.passed=m.rows<=1&&m.valueHeight<=m.fontSize*1.5&&m.cardScroll<=1&&m.pageOverflow<=1&&m.numberRight<=m.valueRight+1&&(!m.unitRight||m.unitRight<=m.valueRight+1);
    if(phase==='after') {
     const original=samples.find(([id])=>m.id.replace(/-\d+$/,'')===id);
     record.passed&&=m.raw===String(original[1]);
     record.passed&&=m.title.includes(String(original[1]));
     if(typeof original[1]==='number'&&Number.isFinite(original[1]))record.passed&&=!m.numberClipped;
     if(m.id.startsWith('fixed-'))record.passed&&=m.display==='1.000';
     if(m.id.startsWith('tiny-'))record.passed&&=Number(m.display)!==0&&Number.isFinite(Number(m.display));
     if(m.id.startsWith('pi-'))record.passed&&=Number.isFinite(Number(m.display));
    }
    report.samples.push(record);
   }
   await page.screenshot({path:resolve(output,`${name}-${viewport}-${theme}.png`),fullPage:true,animations:'disabled'});
   if(phase==='after') {
    await page.evaluate(()=>{const e=document.querySelector('#pi-160');window.__statNode=e.shadowRoot.querySelector('.slex-stat-number');e.style.width='128px'});
    await page.waitForTimeout(100);
    const smaller=await page.locator('#pi-160').evaluate(e=>({display:e.shadowRoot.querySelector('.slex-stat-number').textContent,node:e.shadowRoot.querySelector('.slex-stat-number')===window.__statNode,animated:e.shadowRoot.querySelectorAll('[data-stat-change]').length}));
    await page.locator('#pi-160').evaluate(e=>{e.style.width='240px'});await page.waitForTimeout(100);
    const bigger=await page.locator('#pi-160').evaluate(e=>e.shadowRoot.querySelector('.slex-stat-number').textContent);
    assert.ok(smaller.node);assert.equal(smaller.animated,0);assert.ok(bigger.length>=smaller.display.length);
    assert.deepEqual(errors,[]);report.transitions.push({browser:name,viewport,theme,smaller:smaller.display,bigger,passed:true});
   }
   await page.close();
  }}finally{await browser.close();}
 }
 assert.deepEqual(await fingerprints(),report.artifactHashes,'Artifacts changed during the browser run');
 report.passed=report.samples.every(s=>s.passed);
}catch(error){report.error=error.stack;report.passed=false;}
finally{server.kill();await writeFile(resolve(output,'measurements.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({phase,cases:report.samples.length,failed:report.samples.filter(s=>!s.passed).map(s=>({id:s.id,browser:s.browser,viewport:s.viewport,rows:s.rows,display:s.display,title:s.title})),error:report.error}));
if(phase==='after'&&!report.passed)process.exitCode=1;
