import {test,expect} from "@playwright/test";

for(const width of [390,1280])for(const motion of ["reduce","no-preference"] as const){
  test(`business switch preserves its screen position at ${width}px with ${motion}`,async({page})=>{
    await page.setViewportSize({width,height:844});
    await page.emulateMedia({reducedMotion:motion});
    await page.goto("/");
    await page.evaluate(()=>document.fonts.ready);
    const selector=page.locator(".business-switch");
    await selector.evaluate(el=>window.scrollTo({top:window.scrollY+el.getBoundingClientRect().top-190,behavior:"instant"}));
    await expect(page.locator(".business-copy")).toHaveCSS("opacity","1");
    await selector.evaluate(el=>window.scrollTo({top:window.scrollY+el.getBoundingClientRect().top-190,behavior:"instant"}));
    const top=await selector.evaluate(el=>el.getBoundingClientRect().top);
    for(const world of ["water","coffee","water","coffee"]){
      // click() without focusing reproduces mobile browsers that leave activeElement unchanged.
      await selector.getByRole("button",{name:world==="water"?"Apă":"Cafea",exact:true}).evaluate((el:HTMLElement)=>el.click());
      await expect(page.locator(".membership-card")).toHaveAttribute("data-service",world);
      await page.waitForTimeout(motion==="reduce"?150:1100);
      expect(Math.abs(await selector.evaluate(el=>el.getBoundingClientRect().top)-top)).toBeLessThan(2);
      await expect(page.locator(".coffee-shop")).toHaveCount(world==="coffee"?1:0);
    }
  });
}
