import { test, expect } from '@playwright/test';
import { coffeeProducts } from '../src/lib/coffee-catalog';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/catalog', route => route.fulfill({ json: {
    products: coffeeProducts, managed: false, checkout: false, shippingBani: 0,
  } }));
});

for (const width of [320,390,430,768,1280,1920]) {
  test(`shared hero presents both services at ${width}px`,async ({page})=>{
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    const hero=page.locator('.hero');
    await expect(hero.locator('h1')).toHaveText('Energie și hidratare premium pentru tine și echipa ta!');
    await expect(hero.locator('img')).toHaveCount(0);
    await expect(hero.locator('video')).toHaveCount(0);
    await expect(hero.locator('.hero-art .element-scene')).toBeVisible();
    await expect(hero.locator('.hero-world-switch')).toHaveCount(0);
    await expect(hero.locator('.hero-description')).toContainText('Espressoare, dozatoare');
    await expect(hero.locator('.element-identity')).toContainText('SwitchMORN Coffee \u00b7 Vero Aqua');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await hero.getByRole('button',{name:'Solicită ofertă pentru echipa ta'}).click();
    await expect(page.locator('.contact-dialog #interest')).toContainText('Cafea + apă');
    await page.keyboard.press('Escape');
  });
}

test('navigation has a solid background and stays visible on scroll',async({page})=>{
  await page.goto('/');
  const header=page.locator('.site > header');
  await expect(header).toHaveCSS('background-color','rgb(23, 17, 14)');
  await expect(header).toHaveCSS('position','sticky');
  await page.locator('#ecosistem').scrollIntoViewIfNeeded();
  expect((await header.boundingBox())!.y).toBe(0);
});

for(const viewport of [{width:390,height:844},{width:844,height:390}]) {
  test(`navigation menu opens and restores focus at ${viewport.width}px`,async({page})=>{
    await page.setViewportSize(viewport);
    await page.goto('/');
    const button=page.getByRole('button',{name:'Deschide meniul',exact:true});
    await button.click();
    const menu=page.getByRole('dialog',{name:'Meniul Makeon'});
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
    await expect(button).toBeFocused();
  });
}
