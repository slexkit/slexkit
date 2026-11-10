import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,firefox,webkit} from 'playwright';

const base=process.argv[2]||'http://localhost:4199';
const results=[];
await mkdir('test-results/html-component-api-review',{recursive:true});
for(const [name,engine] of Object.entries({chromium,firefox,webkit})) {
 const browser=await engine.launch();
 try {
  const page=await browser.newPage({viewport:{width:1280,height:960},colorScheme:'light',reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const slug of ['grid','select','table','stat']) {
   const result={browser:name,slug};
   try {
    await page.goto(base+'/docs/components/'+slug,{waitUntil:'networkidle'});
    const region=page.locator('.slex-doc-table-scroll');await region.waitFor();
    for(const width of [390,1280,390,1280]) {
     await page.setViewportSize({width,height:960});
     await page.waitForFunction(narrow=>document.querySelector('.slex-doc-table-scroll')?.dataset.fittedColumns===(narrow?'true':'false'),width===390);
     await page.waitForTimeout(50);
     assert.equal(await region.getAttribute('data-fitted-columns'),width===390?'true':'false');
     assert.equal(await region.locator('colgroup col').count(),width===390?4:0);
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
     if(width===390) {
      await region.evaluate(e=>e.scrollLeft=e.scrollWidth);
      const gap=await region.evaluate(e=>{
       const field=e.querySelector('tbody .slex-doc-table__identifier'),desc=e.querySelector('tbody .slex-doc-table__description');
       const walker=document.createTreeWalker(desc,NodeFilter.SHOW_TEXT);let node;
       while((node=walker.nextNode())&&!node.textContent.trim()){}
       const range=document.createRange();range.selectNodeContents(node||desc);
       return range.getClientRects()[0].left-field.getBoundingClientRect().right;
      });
      assert.ok(gap>=13&&gap<=15,'description keeps its 14px inset beside the pinned field');
     } else assert.equal(await region.getAttribute('tabindex'),null);
    }
    const previous=await page.locator('html').getAttribute('data-theme');
    await page.getByRole('button',{name:'Toggle theme',exact:true}).click();
    await page.waitForFunction(old=>document.documentElement.dataset.theme!==old,previous);
    const changed=await page.locator('html').getAttribute('data-theme');
    const color=await region.evaluate(e=>getComputedStyle(e).backgroundColor);
    result.theme={previous,changed,color};
    assert.ok(changed==='light'||changed==='dark');
    assert.deepEqual(errors,[]);result.passed=true;
   } catch(error){result.error=error.stack;result.passed=false;}
   results.push(result);
  }
 } finally {await browser.close();}
}
const report={date:new Date().toISOString(),results,passed:results.every(r=>r.passed)};
await writeFile('test-results/html-component-api-review/resize.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
if(!report.passed)process.exitCode=1;
