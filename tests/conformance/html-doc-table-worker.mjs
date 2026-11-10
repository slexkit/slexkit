import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,firefox,webkit} from 'playwright';

const base=process.argv[2]||'http://localhost:4199';
const output=resolve('test-results/html-table-review');
await mkdir(output,{recursive:true});
const legacy='# Reference table stress fixture\n\n| Field | Type | Required | Dynamic | Default | Description |\n|---|---|---|---|---|---|\n| `description` | string | No | Yes | `""` | Assistive description below the input, associated with the control for screen readers. |\n| `placeholder` | string | No | Yes | `""` | Placeholder shown inside the empty input. Keep a visible label alongside it. |\n| `errorMessage` | string | No | Yes | `""` | A long validation message that must remain readable instead of forcing property identifiers to break. |';
const generic='# Ordinary table\n\n| Name | Count | Explanation |\n|:---|---:|:---:|\n| Alpha | 12 | A short explanation. |\n| Beta | 300 | Ordinary table text wraps naturally. |';
const query=source=>'/playground.html?mode=render&type=markdown&source='+encodeURIComponent(source);
const cases=[
  ['input-en-desktop','/docs/components/input',1280,'light'],
  ['input-en-mobile','/docs/components/input',390,'light'],
  ['input-zh-desktop','/zh-CN/docs/components/input',1280,'light'],
  ['input-zh-mobile','/zh-CN/docs/components/input',390,'light'],
  ['input-dark','/docs/components/input',1280,'dark'],
  ['legacy-six-columns',query(legacy),1280,'light'],
  ['ordinary-alignment',query(generic),390,'light'],
];
const report={date:new Date().toISOString(),base,results:[]};
for(const [name,engine] of Object.entries({chromium,firefox,webkit})) {
 const browser=await engine.launch();
 try { for(const [id,path,width,theme] of cases) {
  const item={browser:name,version:browser.version(),id,width,theme};
  const context=await browser.newContext({viewport:{width,height:960},colorScheme:theme,reducedMotion:'reduce'});
  await context.addInitScript(theme=>{try{localStorage.setItem('slexkit:theme',theme)}catch{}},theme);
  const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try {
   await page.goto(base+path,{waitUntil:'networkidle'});
   const region=page.locator('.slex-doc-table-scroll').first();await region.waitFor();
   await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(200);
   await region.evaluate(e=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:e.getBoundingClientRect().top+scrollY-110,behavior:'instant'})});
   await page.waitForTimeout(200);
   item.metrics=await region.evaluate(e=>{
    const t=e.querySelector('table'),header=[...t.querySelectorAll('thead th')],row=t.querySelector('tbody tr'),cells=[...row.children];
    const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
    return {region:rect(e),table:rect(t),clientWidth:e.clientWidth,scrollWidth:e.scrollWidth,pageOverflow:document.documentElement.scrollWidth-innerWidth,
     reference:e.dataset.referenceTable,tabIndex:e.getAttribute('tabindex'),role:e.getAttribute('role'),label:e.getAttribute('aria-label'),display:getComputedStyle(t).display,
     header:header.map(e=>({text:e.textContent,scope:e.scope,...rect(e)})),
     code:[...t.querySelectorAll('tbody code')].map(e=>{const r=document.createRange();r.selectNodeContents(e);return {text:e.textContent,lines:r.getClientRects().length,...rect(e)}}),
     cells:cells.map(e=>{const s=getComputedStyle(e);return {...rect(e),paddingTop:s.paddingTop,paddingBottom:s.paddingBottom,borderLeft:s.borderLeftWidth,borderRight:s.borderRightWidth,fontSize:s.fontSize,textAlign:s.textAlign}})};
   });
   const m=item.metrics,overflow=m.scrollWidth>m.clientWidth+1;
   assert.equal(m.display,'table');
   assert.ok(m.header.every(h=>h.scope==='col'),'native column-header semantics');
   assert.ok(m.pageOverflow<=1,'only the table may overflow, never the page');
   assert.ok(m.code.every(c=>c.lines<=1),'inline API identifiers must not split across lines');
   assert.ok(m.cells.every(c=>c.paddingTop==='12px'&&c.paddingBottom==='12px'),'12px vertical cell padding');
   assert.ok(m.cells.every(c=>c.borderLeft==='0px'&&c.borderRight==='0px'),'no vertical spreadsheet grid');
   if(id.startsWith('input')) {
    assert.equal(m.reference,'true');assert.equal(m.header.length,4);
    assert.ok(m.cells[3].width>=Math.min(220,m.clientWidth-m.cells[0].width-1),'description fits beside the mobile field, with at least 220px on desktop');
    if(width>=1280)assert.equal(overflow,false,'four-column API reference should fit the desktop article');
   }
   if(id==='ordinary-alignment') {
    assert.equal(m.reference,'false');assert.equal(m.cells[1].textAlign,'right');assert.equal(m.cells[2].textAlign,'center');
   }
   if(overflow) {
    assert.equal(m.tabIndex,'0');assert.equal(m.role,'region');assert.ok(m.label);
    await region.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.waitForTimeout(200);
    assert.ok(await region.evaluate(e=>e.scrollLeft)>0,'keyboard can scroll the table');
    await region.evaluate(e=>e.scrollLeft=e.scrollWidth);
    if(m.reference==='true') {
     const anchored=await region.evaluate(e=>Math.abs(e.querySelector('tbody .slex-doc-table__identifier').getBoundingClientRect().left-e.getBoundingClientRect().left));
     assert.ok(anchored<=2,'field column remains visible when reading the description');
     await region.evaluate(e=>e.blur());
     await page.screenshot({path:resolve(output,`${name}-${id}-scrolled.png`)});
    }
    await region.evaluate(e=>{e.scrollLeft=0;e.blur()});
   } else {assert.equal(m.tabIndex,null);assert.equal(m.role,null);}
   await page.screenshot({path:resolve(output,`${name}-${id}.png`)});
   assert.deepEqual(errors,[]);item.passed=true;
  } catch(error){item.passed=false;item.error=error.stack;await page.screenshot({path:resolve(output,`${name}-${id}-failure.png`)}).catch(()=>{});}
  report.results.push(item);console.log(JSON.stringify({browser:name,id,passed:item.passed,error:item.error}));await context.close();
  await writeFile(resolve(output,'measurements.json'),JSON.stringify(report,null,2));
 }} finally {await browser.close();}
}
report.passed=report.results.every(r=>r.passed);await writeFile(resolve(output,'measurements.json'),JSON.stringify(report,null,2));
if(!report.passed)process.exitCode=1;
