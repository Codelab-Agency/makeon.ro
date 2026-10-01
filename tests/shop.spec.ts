import { test, expect } from "@playwright/test";

test("the shop filters real catalog products and shows their pack sizes", async ({page})=>{
  await page.goto("/cafea");
  await expect(page.locator(".shop-product-card")).toHaveCount(17);
  await page.getByRole("button",{name:/Cafea boabe/}).click();
  await expect(page.locator(".shop-product-card")).toHaveCount(5);
  const exotic=page.locator(".shop-product-card").filter({has:page.getByRole("heading",{name:"Exotic Blend",exact:true})});
  await expect(exotic).toContainText("1 kg");
  await page.getByRole("button",{name:/Toate cafelele/}).click();
  await page.getByRole("textbox",{name:"Caută cafeaua"}).fill("Decaff");
  await expect(page.locator(".shop-product-card")).toHaveCount(1);
  await expect(page.locator(".shop-product-card")).toContainText("250 g");
  await page.getByRole("textbox",{name:"Caută cafeaua"}).fill("xyz-no-coffee");
  await expect(page.getByRole("heading",{name:"Nicio cafea găsită."})).toBeVisible();
  await page.getByRole("button",{name:"Resetează filtrele"}).click();
  await expect(page.locator(".shop-product-card")).toHaveCount(17);
});

test("grind and quantities persist in the cart across product pages and reloads",async({page})=>{
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/cafea/etiopia");
  await expect(page.getByRole("heading",{level:1})).toHaveText("Etiopia");
  await page.getByRole("combobox",{name:"Măcinare pentru"}).click();
  await page.getByRole("option",{name:"Ibric",exact:true}).click();
  await page.getByRole("spinbutton",{name:"Număr de ambalaje"}).fill("2");
  await page.getByRole("button",{name:"Adaugă în coș",exact:true}).click();
  await expect(page.getByRole("button",{name:"Deschide coșul de cafea (2)"})).toBeVisible();
  await page.goto("/cafea/intense");
  await expect(page.getByRole("button",{name:"Deschide coșul de cafea (2)"})).toBeVisible();
  await page.getByRole("button",{name:"Adaugă în coș",exact:true}).click();
  await page.reload();
  await page.getByRole("button",{name:"Deschide coșul de cafea (3)"}).click();
  const cart=page.getByRole("dialog",{name:"Coșul de cafea"});
  await expect(cart).toBeVisible();
  await expect(cart.locator(".cart-line")).toHaveCount(2);
  await expect(cart).toContainText("250 g · Ibric");
  await expect(cart).toContainText("500 g · Boabe");
  await expect(cart).toContainText("Preț la cerere");
  await cart.getByRole("button",{name:"Crește cantitatea Intense"}).click();
  await expect(cart).toContainText("4 produse");
  await cart.getByRole("button",{name:"Elimină Etiopia, Ibric"}).click();
  await expect(cart.locator(".cart-line")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(cart).not.toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow","hidden");
  expect(errors).toEqual([]);
});

test("the product page fits on mobile and invalid products return 404",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/cafea/chicory");
  await expect(page.getByRole("heading",{level:1})).toHaveText("Chicory");
  await expect(page.locator(".detail-description")).toContainText("Conține gluten");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  const response=await page.goto("/cafea/produs-inexistent");
  expect(response?.status()).toBe(404);
});
