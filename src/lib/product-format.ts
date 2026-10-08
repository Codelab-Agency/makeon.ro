import type { CoffeeCategory, DecaffFormat } from "./coffee-catalog";

type ProductFormat = { category: CoffeeCategory; decaffFormat?: DecaffFormat | null; grams?: number | null; unitLabel?: string | null };
export const isGroundCoffee = (product: ProductFormat) =>
  product.category === "macinata" || (product.category === "decaff" && product.decaffFormat !== "boabe");
export const isWholeBean = (product: ProductFormat) =>
  product.category === "boabe" || (product.category === "decaff" && product.decaffFormat === "boabe");
export const defaultProductFormat = (product: ProductFormat) =>
  product.category === "complementare" ? "Standard" : isWholeBean(product) ? "Boabe" : isGroundCoffee(product) ? "Espresso" : "Instant";
/** Unit/pack names stay independent of the internal selection discriminator. */
export const packageLabel = (product: ProductFormat) =>
  product.category === "complementare" ? product.unitLabel?.trim() || "1 buc." : product.grams === 1000 ? "1 kg" : product.grams ? `${product.grams} g` : "Ambalaj";
