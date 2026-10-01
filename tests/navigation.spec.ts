import {test,expect} from "@playwright/test";

test("header stays at the top and retains its links on the shop and product pages",async({page})=>{
  await page.goto("/");
  const links=()=>page.getByRole("navigation",{name:"Navigație principală"}).getByRole("link").evaluateAll(elements=>elements.map(el=>({text:el.textContent,href:el.getAttribute("href")})));
  const original=await links();
  expect(original).toHaveLength(5);
  for(const path of ["/","/cafea","/cafea/etiopia"]){
    await page.goto(path);
    expect(await links()).toEqual(original);
    await page.evaluate(()=>window.scrollTo({top:650,behavior:"instant"}));
    await expect(page.locator(".header")).toHaveCSS("position","sticky");
    expect(await page.locator(".header").evaluate(el=>el.getBoundingClientRect().top)).toBe(0);
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto("/cafea");
  await page.evaluate(()=>window.scrollTo({top:600,behavior:"instant"}));
  await page.getByRole("button",{name:"Deschide meniul"}).click();
  const nav=page.getByRole("navigation",{name:"Navigație mobilă"});
  await expect(nav.getByRole("link")).toHaveCount(5);
  await nav.getByRole("link",{name:"Servicii",exact:true}).click();
  await expect(page).toHaveURL(/\/#servicii$/);
  await expect(page.locator("#servicii")).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
