import { getCMS } from "@/lib/cms";
import { deliverOrderStatusEmails, orderStatusEmailHistory } from "@/lib/order-status-email";
import { allowedRequestOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";
export const maxDuration = 60;

async function handle(request: Request, retry: boolean) {
  if (retry && !allowedRequestOrigin(request))
    return Response.json({ error: "Solicitare nepermisă." }, { status: 403 });
  try {
    const cms = await getCMS();
    const { user } = await cms.auth({ headers: request.headers });
    if (!user || user.collection !== "users")
      return Response.json({ error: "Autentificare necesară." }, { status: 401 });
    const orderID = Number(new URL(request.url).searchParams.get("orderID"));
    if (!Number.isSafeInteger(orderID) || orderID <= 0)
      return Response.json({ error: "Comandă invalidă." }, { status: 400 });
    await cms.findByID({ collection: "orders", id: orderID, user, overrideAccess: false });
    if (retry) await deliverOrderStatusEmails(cms, orderID);
    return Response.json({ notifications: await orderStatusEmailHistory(cms, orderID) },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    // Keep provider/customer data out of the response; log only the failure category.
    console.error("Order notification request failed", error instanceof Error ? error.name : "unknown");
    return Response.json({ error: "Notificările nu pot fi verificate momentan." }, { status: 503 });
  }
}
export const GET = (request: Request) => handle(request, false);
export const POST = (request: Request) => handle(request, true);
