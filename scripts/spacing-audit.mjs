import { chromium, firefox, webkit } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Browser rectangles, not screenshot pixel colors: dotted canvases, glyphs and
// shadows make pixel-white counting misleading. Occupancy is the union of the
// explicitly recorded major-block rectangles, clipped to the preview region.
const phase = process.argv[2] || 'after';
const output = resolve('test-results/html-spacing', phase);
await mkdir(output, { recursive: true });
const names = (process.env.SPACING_BROWSERS || 'chromium').split(',');
const cases = [
  ['home-desktop', '/', 1280, 960, 'light'],
  ['home-mobile', '/', 390, 844, 'light'],
  ['home-tablet', '/', 768, 1024, 'light'],
  ['input-desktop', '/docs/components/input', 1280, 960, 'light'],
  ['card-desktop', '/docs/components/card', 1280, 960, 'light'],
  ['input-mobile', '/docs/components/input', 390, 844, 'light'],
  ['home-dark', '/', 1280, 960, 'dark'],
];
const round = n => Math.round(n * 100) / 100;
function unionArea(rectangles, region) {
  const boxes = rectangles.map(r => ({ x: Math.max(r.x, region.x), y: Math.max(r.y, region.y),
    right: Math.min(r.x+r.w, region.x+region.w), bottom: Math.min(r.y+r.h, region.y+region.h) }))
    .filter(r => r.right > r.x && r.bottom > r.y);
  const xs = [...new Set(boxes.flatMap(r => [r.x, r.right]))].sort((a,b)=>a-b);
  let area=0;
  for(let i=1;i<xs.length;i++) {
    const intervals=boxes.filter(r=>r.x<xs[i]&&r.right>xs[i-1]).map(r=>[r.y,r.bottom]).sort((a,b)=>a[0]-b[0]);
    let length=0, end=-Infinity;
    for(const [a,b] of intervals) { length+=Math.max(0,b-Math.max(a,end)); end=Math.max(end,b); }
    area+=(xs[i]-xs[i-1])*length;
  }
  return area;
}
const report={phase, date:new Date().toISOString(), method:'CSS px; deviceScaleFactor=1; zoom=1; fonts.ready; rectangle union clipped to preview; excludes toolbar; not pixel ink density', results:[]};
for(const name of names) {
  const browser=await ({chromium,firefox,webkit}[name]).launch({headless:true});
  try {
    for(const [id, route, width, height, theme] of cases) {
      for(const [variant,base] of phase==='before' ? [['original','https://slexkit.dev'],['current','http://localhost:4199']] : phase==='reference' ? [['original','https://slexkit.dev']] : [['current','http://localhost:4199']]) {
        const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,colorScheme:theme,reducedMotion:'reduce'});
        await context.addInitScript(theme=>localStorage.setItem('slexkit:theme',theme),theme);
        const page=await context.newPage();
        const item={id,variant,browser:name,version:browser.version(),width,height,theme,url:base+route};
        try {
          await page.goto(item.url,{waitUntil:'domcontentloaded',timeout:45000});
          await page.locator(homeSelector(id)).first().waitFor({timeout:15000});
          await page.evaluate(()=>document.fonts.ready);
          await page.waitForTimeout(1200);
          await page.waitForLoadState('networkidle', {timeout:10000}).catch(()=>{});
          const home=id.startsWith('home');
          const target=page.locator(home?'.slex-home-preview':'.slex-example-shell, .slex-playground').first();
          await target.waitFor({timeout:15000});
          const targetBox=await target.boundingBox();
          await page.evaluate(y=>{
            document.documentElement.style.scrollBehavior='auto';
            scrollTo({top:Math.max(0,y-64),behavior:'instant'});
          },targetBox.y);
          await page.waitForTimeout(300);
          item.frames=[];
          for(const frame of page.frames()) {
            await frame.evaluate(()=>document.fonts.ready);
            const offset=await frameOffset(frame);
            if(!offset) continue;
            const data=await frame.evaluate(()=>{
              const rect=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e.shadowRoot?.querySelector('.slex-grid')||e);return {tag:e.tagName,id:e.id,cls:typeof e.className==='string'?e.className:'',text:e.textContent.trim().slice(0,70),x:r.x,y:r.y,w:r.width,h:r.height,padding:s.padding,margin:s.margin,gap:s.gap,fontSize:s.fontSize,lineHeight:s.lineHeight,columns:s.gridTemplateColumns}};
              const query=q=>{const e=document.querySelector(q);return e&&rect(e)};
              const all=q=>[...document.querySelectorAll(q)].map(rect).filter(r=>r.w>0&&r.h>0);
              const doc=document.querySelector('.slex-doc-streamdown');
              const blocks=doc?[...doc.children].filter(e=>e.matches('h1,h2,p,.katex-display')).map(rect):[];
              // The legacy renderer wraps its grid in .slex-layout. Only major
              // independent blocks are counted; nested formula spans never are.
              const controls=all('#inputs, #outputs, .slex-grid');
              const native=all('.rc-filter-demo > p, .rc-filter-formula, .rc-filter-actions');
              if(!native.length && controls.length) {
                const layout=document.querySelector('.slex-grid')?.parentElement;
                if(layout) for(const e of layout.children) if(!e.matches('.slex-grid')&&e.getBoundingClientRect().height) native.push(rect(e));
              }
              const fields=all('.rc-filter-field');
              if(!fields.length) for(const e of document.querySelector('.slex-grid')?.children||[])fields.push(rect(e));
              return {viewport:{innerWidth,clientWidth:document.documentElement.clientWidth,htmlWidth:document.documentElement.getBoundingClientRect().width,scrollWidth:document.documentElement.scrollWidth,gutter:getComputedStyle(document.documentElement).scrollbarGutter},shell:query('.slex-home-preview, .slex-example-shell, .slex-playground'),preview:query('.slex-playground-preview-pane, .slex-playground-preview, .slex-component-preview'),prose:doc&&rect(doc),heading:doc&&query('.slex-doc-streamdown h1'),controls,fields,blocks:[...blocks,...controls.map(r=>({...r})),...native],demo:query('.rc-filter-demo'),component:query('slex-input, slex-card, .slex-input-field, .slex-card')};
            });
            for(const key of ['shell','preview','prose','heading','demo','component'])if(data[key]) {data[key].x+=offset.x;data[key].y+=offset.y;}
            for(const key of ['controls','fields','blocks'])for(const r of data[key]){r.x+=offset.x;r.y+=offset.y;}
            item.frames.push(data);
          }
          const shell=item.frames[0].shell;
          const preview=item.frames.find(f=>f.preview)?.preview;
          const prose=item.frames.find(f=>f.prose)?.prose;
          const heading=item.frames.find(f=>f.heading)?.heading;
          const controls=item.frames.flatMap(f=>f.controls);
          const blocks=item.frames.flatMap(f=>f.blocks);
          const grid=controls[0];
          const component=item.frames.find(f=>f.component)?.component;
          const actions=blocks.find(r=>r.cls==='rc-filter-actions');
          const occupancy=home?blocks:component?[component]:[];
          const fields=item.frames.flatMap(f=>f.fields).slice(0,4);
          const fieldGaps=fields.slice(1).map((r,i)=>Math.abs(r.y-fields[i].y)<1?r.x-fields[i].x-fields[i].w:r.y-fields[i].y-fields[i].h);
          item.metrics={shellWidth:shell?.w,shellHeight:shell?.h,previewPadding:preview?.padding,proseWidth:home?prose?.w:null,controlsWidth:home?grid?.w:null,
            leftAlignmentError:home&&prose&&grid?Math.abs(prose.x-grid.x):null,
            rightAlignmentError:home&&prose&&grid?Math.abs(prose.x+prose.w-grid.x-grid.w):null,
            titleTopInset:home&&heading&&shell?heading.y-shell.y:null,
            embeddedScrollbarWaste:item.frames.slice(1).filter(f=>f.preview).map(f=>f.viewport.innerWidth-f.viewport.htmlWidth),
            gridGap:grid?.gap,gridColumns:grid?.columns,
            fieldGaps:home?fieldGaps.map(round):null,
            columnWidthSpread:home&&fields.length?Math.max(...fields.map(r=>r.w))-Math.min(...fields.map(r=>r.w)):null,
            actionsHeight:actions?.h,
            componentWidth:home?null:component?.w,componentHeight:home?null:component?.h,
            componentTopSpace:!home&&component&&preview?component.y-preview.y:null,
            componentBottomSpace:!home&&component&&preview?preview.y+preview.h-component.y-component.h:null,
            structuralWhitespacePercent:preview&&occupancy.length?100*(1-unionArea(occupancy,preview)/(preview.w*preview.h)):null,
            pageOverflow:Math.max(0,item.frames[0].viewport.scrollWidth-item.frames[0].viewport.clientWidth)};
          for(const k of Object.keys(item.metrics))if(typeof item.metrics[k]==='number')item.metrics[k]=round(item.metrics[k]);
          if(phase==='after') {
            item.checks={noPageOverflow:item.metrics.pageOverflow===0};
            if(home)Object.assign(item.checks,{
              sharedLeftEdge:item.metrics.leftAlignmentError<=1,
              sharedRightEdge:item.metrics.rightAlignmentError<=1,
              noEmbeddedGutter:item.metrics.embeddedScrollbarWaste.every(n=>Math.abs(n)<=1),
              expectedColumns:grid?.columns.split(' ').length===(width>=768?4:1),
              equalColumns:item.metrics.columnWidthSpread<=1,
              consistent16pxGap:fieldGaps.length===3&&fieldGaps.every(n=>Math.abs(n-16)<=1),
              originalDesktopTitleInset:width<1280||Math.abs(item.metrics.titleTopInset-78.4375)<=1,
              boundedMobileActions:width>=768||(item.metrics.actionsHeight>0&&item.metrics.actionsHeight<160),
            });
          }
          const stem=`${name}-${variant}-${id}`;
          await page.screenshot({path:resolve(output,stem+'.png')});
          // Numbered page overlays use measured global coordinates and do not
          // change document flow or enter the sandboxed content documents.
          const overlay=(home?[['preview',preview],['prose',prose],['inputs',grid],['heading',heading]]:[['preview',preview],['component',component]]).filter(([,r])=>r);
          await page.evaluate(boxes=>{
            const root=document.createElement('div');root.id='spacing-audit-overlay';root.style='position:fixed;inset:0;pointer-events:none;z-index:2147483647';
            boxes.forEach(([label,r],i)=>{const e=document.createElement('div');e.style=`position:absolute;left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;box-sizing:border-box;border:2px solid ${['#d33','#06c','#098','#c60'][i]}`;const t=document.createElement('span');t.textContent=`${label}: ${r.w.toFixed(1)} × ${r.h.toFixed(1)}`;t.style='position:absolute;top:0;left:0;background:#fff;color:#111;font:12px/18px monospace;white-space:nowrap';e.append(t);root.append(e)});document.body.append(root);
          },overlay);
          await page.screenshot({path:resolve(output,stem+'-annotated.png')});
          item.screenshot=stem+'.png';item.annotated=stem+'-annotated.png';item.passed=!item.checks||Object.values(item.checks).every(Boolean);
        } catch(error) {item.error=error.stack;item.passed=false;}
        report.results.push(item);
        console.log(JSON.stringify({id,variant,browser:name,metrics:item.metrics,error:item.error}));
        await context.close();
        await writeFile(resolve(output,'measurements.json'),JSON.stringify(report,null,2));
      }
    }
  } finally {await browser.close();}
}
if(report.results.some(r=>!r.passed))process.exitCode=1;

function homeSelector(id) { return id.startsWith('home')?'.slex-home-preview':'.slex-example-shell, .slex-playground'; }

// Read coordinates in each parent document. WebKit's automation boundingBox for
// nested frames after scrolling can subtract the outer scroll offset twice.
// DOM viewport rectangles plus explicit ancestry avoid that protocol discrepancy.
async function frameOffset(frame) {
  if(!frame.parentFrame())return {x:0,y:0};
  const parent=await frameOffset(frame.parentFrame());
  const own=await (await frame.frameElement()).evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y};});
  return {x:parent.x+own.x,y:parent.y+own.y};
}
