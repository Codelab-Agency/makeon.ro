import type { CoffeeCategory } from "./coffee-catalog";
import { legal } from "./legal";
import { defaultProductFormat, isGroundCoffee } from "./product-format";
import type { DecaffFormat } from "./coffee-catalog";

export type CheckoutLine = { slug: string; grind: string; quantity: number };
export class CommerceError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
/** Require explicit acceptance of the currently displayed terms at the HTTP boundary.
 * This is contractual acknowledgement, not consent to marketing/data processing.
 */
export function requireLegalAcceptance(value: unknown): string {
  const body = value as Record<string, unknown> | null;
  if (
    !body ||
    body.termsAccepted !== true ||
    body.legalVersion !== legal.version
  )
    throw new CommerceError(
      "Acceptă Termenii și condițiile și consultă Politica de confidențialitate înainte de comandă.",
    );
  return legal.version;
}
/** Validate untrusted selections and merge duplicate slug/grind pairs before reserving stock. */
export function parseLines(body: unknown): CheckoutLine[] {
  if (
    !body ||
    typeof body !== "object" ||
    !("items" in body) ||
    !Array.isArray(body.items) ||
    body.items.length < 1 ||
    body.items.length > 50
  )
    throw new CommerceError(
      "Coșul trebuie să conțină între 1 și 50 de selecții.",
    );
  const combined = new Map<string, CheckoutLine>();
  for (const raw of body.items) {
    if (
      !raw ||
      typeof raw !== "object" ||
      typeof raw.slug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw.slug) ||
      raw.slug.length > 150 ||
      typeof raw.grind !== "string" ||
      !["Boabe", "Ibric", "Moka", "Espresso", "Instant", "Standard"].includes(raw.grind) ||
      !Number.isInteger(raw.quantity) ||
      raw.quantity < 1 ||
      raw.quantity > 99
    )
      throw new CommerceError(
        "Selecția conține un produs sau o cantitate invalidă.",
      );
    const key = `${raw.slug}:${raw.grind}`;
    const previous = combined.get(key);
    const quantity = (previous?.quantity ?? 0) + raw.quantity;
    if (quantity > 99)
      throw new CommerceError(
        "Maximum 99 de ambalaje pentru aceeași selecție.",
      );
    combined.set(key, { slug: raw.slug, grind: raw.grind, quantity });
  }
  return [...combined.values()];
}
export function validGrind(category: CoffeeCategory, grind: string, decaffFormat?: DecaffFormat | null) {
  const product = {category, decaffFormat};
  return isGroundCoffee(product) ? ["Ibric", "Moka", "Espresso"].includes(grind) : grind === defaultProductFormat(product);
}
/** Convert a CMS price in RON to integer bani; missing prices cannot enter checkout. */
export function priceBani(price: number | null | undefined): number {
  const bani = Math.round((price ?? 0) * 100);
  if (!Number.isSafeInteger(bani) || bani <= 0)
    throw new CommerceError(
      "Prețul acestui produs nu este încă disponibil.",
      409,
    );
  return bani;
}
