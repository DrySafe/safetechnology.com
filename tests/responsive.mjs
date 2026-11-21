import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
try {
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:768,height:1024},{width:844,height:390}]) {
  const page=await browser.newPage({viewport,isMobile:true,hasTouch:true});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3000');await page.waitForTimeout(2600);
  const start=await page.locator('.journey-scroll').evaluate(el=>el.getBoundingClientRect().top+scrollY);
  for(const [fraction,phase] of [[.02,'network'],[.18,'approach'],[.30,'flight'],[.5,'processor'],[.86,'neural']]) {
   await page.evaluate(y=>scrollTo(0,y),start+fraction*2200);await page.waitForTimeout(650);
   assert.equal(await page.locator('.journey .scene-container').getAttribute('data-phase'),phase,`${viewport.width}: scroll advances the 3D zoom`);
   const bounds=await page.locator('.journey').boundingBox();
   assert.ok(Math.abs(bounds.y)<2&&bounds.height<=viewport.height+1,'Journey stays within the mobile viewport');
   if(phase==='processor'||phase==='neural') {
    const copy=await page.locator('.journey-copy').boundingBox();
    assert.ok(copy.y>=0&&copy.y+copy.height<viewport.height,'Journey copy is not clipped');
   }
   if(phase==='neural')await page.screenshot({path:`test-results/responsive-${viewport.width}-journey.png`});
  }
  // A finger swipe starting on the WebGL scene must scroll the document.
  await page.evaluate(y=>scrollTo(0,y),start+300);await page.waitForTimeout(300);
  const before=await page.evaluate(()=>scrollY);const client=await page.context().newCDPSession(page);
  const x=viewport.width*.7,y=viewport.height*.5;
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=8;i++) {await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*15}]});await page.waitForTimeout(25);}
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(500);
  assert.ok(await page.evaluate(()=>scrollY)>before+40,'Touch scroll is not trapped by the 3D scene');
  for(const selector of ['.showcase-intro','.project-chat','.project-custom','.process','.faq','.footer']) {
   await page.locator(selector).scrollIntoViewIfNeeded();await page.waitForTimeout(400);
   assert.ok(await page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1}),`${viewport.width}: ${selector} fits horizontally`);
  }
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(500);
  const footer=await page.locator('.footer-bottom').boundingBox();
  assert.ok(footer.y>=0&&footer.y+footer.height<=viewport.height,'Footer is reachable after journey');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`test-results/responsive-${viewport.width}-footer.png`});
  await page.locator('.project-chat').scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/responsive-${viewport.width}-project.png`});
  await page.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS: 320/390/768px and landscape; 3D scroll phases, touch swipe, cards, footer, no overflow or JS errors.');
} finally {await browser.close();}
