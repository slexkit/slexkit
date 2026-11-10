import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,firefox,webkit} from 'playwright';

const base=(process.argv[2]||'http://localhost:4199').replace(/\/$/,'');
const preliminary=process.env.API_PRELIM==='1';
const output=resolve('test-results/html-component-api-review',preliminary?'preliminary':'acceptance');
await mkdir(output,{recursive:true});
const catalog=JSON.parse(await readFile('dist/custom-elements.json','utf8')).modules.flatMap(m=>m.declarations).filter(d=>d.customElement);
const slugs=[...catalog.map(d=>d.tagName.slice(5)).sort(),'playground'];
const browserNames=(process.env.API_BROWSERS||'chromium,firefox,webkit').split(',');
const locales=(process.env.API_LOCALES||'en-US,zh-CN').split(',');
const widths=(process.env.API_WIDTHS||'1280,390').split(',').map(Number);
const themes=(process.env.API_THEMES||'light,dark').split(',');
const report={date:new Date().toISOString(),base,preliminary,defaultComponents:catalog.length,optionalComponents:1,results:[]};
async function fingerprint() {
 const paths=['site/data/component-api.ts','site/data/component-api-docs.ts','site/markdown/DocumentTable.svelte','site/styles/doc-tables.css','site/.bun-dist/main.css','site/.bun-dist/main.js'];
 for(const slug of slugs)for(const locale of ['en-US','zh-CN'])paths.push(`site/content/components/${slug}/${locale}.md`);
 return Object.fromEntries(await Promise.all(paths.map(async path=>[path,createHash('sha256').update(await readFile(path)).digest('hex')])));
}
report.sourceHashes=await fingerprint();
let save=Promise.resolve();
const persist=()=>save=save.then(()=>writeFile(resolve(output,'measurements.json'),JSON.stringify(report,null,2)));
for(const browserName of browserNames) {
 const browser=await ({chromium,firefox,webkit}[browserName]).launch();
 try {
  const combinations=locales.flatMap(locale=>widths.flatMap(width=>themes.map(theme=>({locale,width,theme}))));
  async function group({locale,width,theme}) {
   const context=await browser.newContext({viewport:{width,height:960},deviceScaleFactor:1,colorScheme:theme,reducedMotion:'reduce'});
   await context.addInitScript(theme=>{try{localStorage.setItem('slexkit:theme',theme)}catch{}},theme);
   const page=await context.newPage();page.setDefaultTimeout(15000);
   let pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
   try { for(const slug of slugs) {
    const id=`${browserName}-${locale}-${width}-${theme}-${slug}`;
    const result={id,slug,locale,width,theme,browser:browserName,version:browser.version(),optional:slug==='playground'};
    pageErrors=[];
    try {
     if(slug==='playground') {
      const source=(await readFile(`site/content/components/playground/${locale}.md`,'utf8')).replace(/^---[\s\S]*?---\s*/, '');
      result.route='/playground.html (optional documentation preview)';
      await page.goto(base+'/playground.html?mode=render&type=markdown&source='+encodeURIComponent(source),{waitUntil:'domcontentloaded'});
     } else {
      result.route=(locale==='en-US'?'':'/zh-CN')+'/docs/components/'+slug;
      await page.goto(base+result.route,{waitUntil:'domcontentloaded'});
     }
     const region=page.locator('.slex-doc-table-scroll').first();await region.waitFor();
     await page.waitForFunction(()=>document.querySelector('.slex-doc-table-scroll')?.dataset.referenceTable==='true');
     await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(60);
     await region.evaluate(e=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:e.getBoundingClientRect().top+scrollY-110,behavior:'instant'})});
     await page.waitForTimeout(30);
     result.metrics=await region.evaluate(e=>{
      const table=e.querySelector('table'),headers=[...table.querySelectorAll('thead th')],rows=[...table.querySelectorAll('tbody tr')],allCells=[...table.querySelectorAll('th,td')];
      const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
      const code=[...table.querySelectorAll('code')].map(e=>{const r=document.createRange();r.selectNodeContents(e);return {text:e.textContent,lines:r.getClientRects().length}});
      const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
      const rgb=(base,overlay)=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=base;ctx.fillRect(0,0,1,1);if(overlay){ctx.fillStyle=overlay;ctx.fillRect(0,0,1,1)}return [...ctx.getImageData(0,0,1,1).data].slice(0,3)};
      const luminosity=rgb=>rgb.map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4}).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0);
      const contrast=el=>{const s=getComputedStyle(el),bg=rgb(getComputedStyle(e).backgroundColor,s.backgroundColor);const bgCss=`rgb(${bg.join(',')})`,fg=rgb(bgCss,s.color);const a=luminosity(bg),b=luminosity(fg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
      return {region:rect(e),table:rect(table),clientWidth:e.clientWidth,scrollWidth:e.scrollWidth,pageOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),theme:document.documentElement.dataset.theme,
       tableDisplay:getComputedStyle(table).display,header:headers.map(el=>({text:el.textContent,scope:el.scope,...rect(el)})),rows:rows.length,code,
       cells:allCells.map(el=>{const s=getComputedStyle(el);return {paddingTop:s.paddingTop,paddingBottom:s.paddingBottom,paddingLeft:s.paddingLeft,paddingRight:s.paddingRight,borderLeft:s.borderLeftWidth,borderRight:s.borderRightWidth,fontSize:s.fontSize}}),
       widths:rows[0]?[...rows[0].children].map(el=>el.getBoundingClientRect().width):[],role:e.getAttribute('role'),tabIndex:e.getAttribute('tabindex'),label:e.getAttribute('aria-label'),
       minHeaderContrast:Math.min(...headers.map(contrast)),minBodyContrast:Math.min(...[...(rows[0]?.children||[])].map(contrast))};
     });
     const m=result.metrics,overflow=m.scrollWidth>m.clientWidth+1;
     result.checks={fourColumns:m.header.length===4,nativeTable:m.tableDisplay==='table',columnHeaders:m.header.every(h=>h.scope==='col'),hasRows:m.rows>0,
      noPageOverflow:m.pageOverflow<=1,unbrokenIdentifiers:m.code.every(c=>c.lines<=1),consistentPadding:m.cells.every(c=>c.paddingTop==='12px'&&c.paddingBottom==='12px'&&c.paddingLeft==='14px'&&c.paddingRight==='14px'),
      noVerticalGrid:m.cells.every(c=>c.borderLeft==='0px'&&c.borderRight==='0px'),readable14px:m.cells.every(c=>c.fontSize==='14px'),descriptionWidth:m.widths[3]>=Math.min(220,m.clientWidth-m.widths[0]-1),
      requestedTheme:m.theme===theme,headerContrast:m.minHeaderContrast>=4.5,bodyContrast:m.minBodyContrast>=4.5,
      desktopFits:width<1000||!overflow,keyboardAccess:overflow?m.tabIndex==='0'&&m.role==='region'&&!!m.label:m.tabIndex===null&&m.role===null};
     if(overflow) {
      await region.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.waitForTimeout(90);
      result.checks.keyboardScroll=await region.evaluate(e=>e.scrollLeft>0);
      await region.evaluate(e=>{e.scrollLeft=e.scrollWidth;e.blur()});
      const edge=await region.evaluate(e=>Math.abs(e.querySelector('tbody .slex-doc-table__identifier').getBoundingClientRect().left-e.getBoundingClientRect().left));
      result.checks.stickyField=edge<=2;
      result.scrollGeometry=await region.evaluate(e=>{
       const field=e.querySelector('tbody .slex-doc-table__identifier'),description=e.querySelector('tbody .slex-doc-table__description');
       const walker=document.createTreeWalker(description,NodeFilter.SHOW_TEXT);let node;
       while((node=walker.nextNode())&&!node.textContent.trim()){}
       const range=document.createRange();range.selectNodeContents(node||description);
       return {fieldRight:field.getBoundingClientRect().right,descriptionTextLeft:range.getClientRects()[0]?.left};
      });
      result.checks.descriptionUnobscured=result.scrollGeometry.descriptionTextLeft>=result.scrollGeometry.fieldRight+4;
      const r=await region.boundingBox();
      await page.screenshot({path:resolve(output,id+'-scrolled.png'),clip:{x:Math.max(0,r.x),y:Math.max(0,r.y),width:Math.min(r.width,width-r.x),height:Math.min(r.height,360,960-r.y)}});
      await region.evaluate(e=>e.scrollLeft=0);
     }
     const r=await region.boundingBox();
     await page.screenshot({path:resolve(output,id+'.png'),clip:{x:Math.max(0,r.x),y:Math.max(0,r.y),width:Math.min(r.width,width-r.x),height:Math.min(r.height,360,960-r.y)}});
     result.screenshot=id+(overflow?'-scrolled':'')+'.png';
     result.checks.noPageErrors=pageErrors.length===0;
     result.pageErrors=pageErrors;
     result.passed=Object.values(result.checks).every(Boolean);
    } catch(error){result.error=error.stack;result.passed=false;}
    report.results.push(result);
    if(!result.passed)console.log(JSON.stringify({id,error:result.error,failed:Object.entries(result.checks||{}).filter(([,pass])=>!pass).map(([key])=>key),widths:result.metrics?.widths}));
   }} finally {await context.close();await persist();console.log(`Finished ${browserName} ${locale} ${width}px ${theme}`);}
  }
  // Two bounded independent contexts share a browser; no simultaneous writes to
  // sources or assets are permitted during the acceptance freeze.
  for(let i=0;i<combinations.length;i+=2) await Promise.all(combinations.slice(i,i+2).map(group));
 } finally {await browser.close();}
}
report.finalSourceHashes=await fingerprint();
report.sourceStable=JSON.stringify(report.sourceHashes)===JSON.stringify(report.finalSourceHashes);
report.passed=report.sourceStable&&report.results.every(r=>r.passed);
report.totalChecks=report.results.reduce((sum,r)=>sum+Object.keys(r.checks||{}).length,0);
await persist();
console.log(JSON.stringify({cases:report.results.length,failed:report.results.filter(r=>!r.passed).length,checks:report.totalChecks,sourceStable:report.sourceStable}));
if(!report.passed)process.exitCode=1;
