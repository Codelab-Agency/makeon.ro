import { test, expect } from '@playwright/test';
import { coffeeProducts } from '../src/lib/coffee-catalog';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/catalog', route => route.fulfill({json:{products:coffeeProducts,managed:false,checkout:false,shippingBani:0}}));
});

for (const width of [320,390,650,768,1280,1920]) {
  test(`public sections share content edges at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width,height:960});
    for (const path of ['/','/apa','/cafea','/cafea/intense']) {
      await page.goto(path);
      await page.evaluate(()=>document.fonts.ready);
      const layout = await page.evaluate(()=>{
        const edges = [...document.querySelectorAll('.site > .header, .site main > .section-padding, .site .hero, .site > footer')].map(el=>{
          const r=el.getBoundingClientRect(),s=getComputedStyle(el);
          return {start:r.left+parseFloat(s.paddingLeft),end:r.right-parseFloat(s.paddingRight)};
        });
        return {edges,overflow:document.documentElement.scrollWidth>innerWidth};
      });
      expect(layout.overflow,path).toBe(false);
      for (const edge of layout.edges) {
        expect(Math.abs(edge.start-layout.edges[0].start),path).toBeLessThan(1);
        expect(Math.abs(edge.end-layout.edges[0].end),path).toBeLessThan(1);
      }
    }
  });
}

test('service titles can grow without pushing actions past their row',async ({page})=>{
  await page.setViewportSize({width:320,height:900});
  await page.goto('/');
  await expect(page.locator('.shop-product-card').first()).toBeAttached();
  await page.evaluate(()=>document.fonts.ready);
  const row=page.locator('.studio-tabs button').first();
  await row.scrollIntoViewIfNeeded();
  expect(await row.evaluate(el=>{
    el.querySelector('.studio-tab-title')!.textContent='Beratung und regelmäßige Wartung für professionelle Kaffeemaschinen';
    const r=el.getBoundingClientRect(),icon=el.querySelector('svg')!.getBoundingClientRect();
    return el.scrollWidth<=el.clientWidth+1&&icon.right<=r.right&&icon.left>=r.left;
  })).toBe(true);
});

test('shared gutters hold in RTL and at the reflow width of 200% zoom',async ({page})=>{
  // 1280 physical pixels at 200% provide 640 CSS pixels of layout space.
  await page.setViewportSize({width:640,height:450});
  await page.goto('/');
  for (const direction of ['ltr','rtl']) {
    await page.evaluate(dir=>document.documentElement.dir=dir,direction);
    const bounds=await page.evaluate(()=>{
      const selectors=['.header','.hero','.ecosystem','.business','.solutions','.service-studio','.private-events','.coffee-shop','.footer'];
      return {overflow:document.documentElement.scrollWidth>innerWidth,edges:selectors.map(selector=>{
        const el=document.querySelector(selector)!,r=el.getBoundingClientRect(),s=getComputedStyle(el);
        return [r.left+parseFloat(s.paddingLeft),innerWidth-r.right+parseFloat(s.paddingRight)];
      })};
    });
    expect(bounds.overflow,direction).toBe(false);
    bounds.edges.forEach(([start,end])=>expect(Math.abs(start-end)).toBeLessThan(1));
  }
});
