import { cancelCheckout, CommerceError } from "@/lib/commerce";
import { checkoutConfigured } from "@/lib/commerce-env";
import { allowedRequestOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!checkoutConfigured())
    return Response.json({ error: "Not configured" }, { status: 503 });
  if (!allowedRequestOrigin(request))
    return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await request.json();
    if (typeof body.key !== "string" || !/^[0-9a-f-]{36}$/i.test(body.key))
      throw new CommerceError("Invalid checkout key");
    const result = await cancelCheckout(body.key);
    return Response.json(result ?? { cancelled: true });
  } catch {
    return Response.json(
      { error: "Nu am putut elibera rezervarea. Aceasta va expira automat." },
      { status: 502 },
    );
  }
}
