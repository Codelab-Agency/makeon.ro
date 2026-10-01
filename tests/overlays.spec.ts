import {test,expect} from "@playwright/test";

test("mobile menu fills the screen, animates, traps focus and restores scrolling",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/");
  const opener=page.getByRole("button",{name:"Deschide meniul"});
  await opener.click();
  const menu=page.getByRole("dialog",{name:"Meniul Makeon"});
  await expect(menu).toBeVisible();
  await expect.poll(()=>menu.evaluate(el=>Math.round(el.getBoundingClientRect().top))).toBe(0);
  expect(await menu.evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}))).toEqual({width:390,height:844});
  await expect(page.getByRole("navigation",{name:"Navigație mobilă"}).getByRole("link")).toHaveCount(5);
  await expect(menu.locator(".mobile-menu-link").last()).toHaveCSS("opacity","1");
  await expect(page.locator("body")).toHaveCSS("overflow","hidden");
  for(let i=0;i<10;i++)await page.keyboard.press("Tab");
  expect(await menu.evaluate(el=>el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(opener).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow","hidden");
  await opener.click();
  await menu.getByRole("link",{name:"Magazin cafea",exact:true}).click();
  await expect(page).toHaveURL(/\/cafea$/);
  await expect(page.getByRole("dialog",{name:"Meniul Makeon"})).not.toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow","hidden");
});

test("cart slides in from the right with a backdrop on desktop and mobile",async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/cafea/intense");
  await page.getByRole("button",{name:"Adaugă în coș",exact:true}).click();
  for(const width of [1280,390]){
    await page.setViewportSize({width,height:844});
    const opener=page.getByRole("button",{name:"Deschide coșul de cafea (1)"});
    await opener.click();
    const cart=page.getByRole("dialog",{name:"Coșul de cafea"});
    await expect(cart).toBeVisible();
    await expect.poll(()=>cart.evaluate(el=>Math.round(el.getBoundingClientRect().right))).toBe(width);
    const rect=await cart.evaluate(el=>({left:el.getBoundingClientRect().left,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}));
    expect(rect.left).toBeGreaterThan(0);
    expect(rect.width).toBeLessThan(width);
    expect(rect.height).toBe(844);
    await expect(cart.locator(".cart-line")).toHaveCount(1);
    await page.mouse.click(5,400);
    await expect(cart).not.toBeVisible();
    await expect(opener).toBeFocused();
    await expect(page.locator("body")).not.toHaveCSS("overflow","hidden");
  }
});
