import { applySession, stripeClient } from "@/lib/commerce";
import { checkoutConfigured } from "@/lib/commerce-env";
import type Stripe from "stripe";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!checkoutConfigured())
    return Response.json({ error: "Not configured" }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature)
    return Response.json({ error: "Missing signature" }, { status: 400 });
  let event: Stripe.Event;
  try {
    // Signature verification requires the untouched body, not parsed/rebuilt JSON.
    event = stripeClient().webhooks.constructEvent(
      await request.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (
    ["checkout.session.completed", "checkout.session.expired"].includes(
      event.type,
    )
  ) {
    try {
      await applySession(event.data.object as Stripe.Checkout.Session);
    } catch {
      // Non-2xx makes Stripe retry; don't expose customer or payment data in logs.
      console.error("Stripe order reconciliation failed:", event.id);
      return Response.json({ error: "Retry reconciliation" }, { status: 500 });
    }
  }
  return Response.json({ received: true });
}
