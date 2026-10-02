import { getProducts } from "@/lib/storefront";
import { checkoutConfigured, cmsConfigured } from "@/lib/commerce-env";
import { getCMS } from "@/lib/cms";
import { reconcileExpired, stripeClient } from "@/lib/commerce";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    // Recover inventory even when an expiration webhook was missed and no
    // remaining stock is available to start another checkout.
    if (checkoutConfigured())
      await reconcileExpired(await getCMS(), stripeClient());
    return Response.json(
      {
        products: await getProducts(),
        managed: cmsConfigured(),
        checkout: checkoutConfigured(),
        shippingBani: checkoutConfigured()
          ? Number(process.env.SHIPPING_PRICE_BANI)
          : null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Catalogul este temporar indisponibil." },
      { status: 503 },
    );
  }
}
