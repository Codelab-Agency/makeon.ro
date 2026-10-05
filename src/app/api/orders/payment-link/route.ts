import { getCMS } from "@/lib/cms";
import { generateProductionPayment } from "@/lib/production-orders";
import { CommerceError } from "@/lib/commerce-validation";
import { allowedRequestOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!allowedRequestOrigin(request))
    return Response.json({ error: "Solicitare nepermisă." }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: "Format invalid." }, { status: 415 });
  try {
    const cms = await getCMS();
    const { user } = await cms.auth({ headers: request.headers });
    if (!user || user.collection !== "users")
      return Response.json(
        { error: "Autentificare necesară." },
        { status: 401 },
      );
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 12000)
      throw new CommerceError("Solicitare prea mare.", 413);
    const body = JSON.parse(raw);
    if (!Number.isSafeInteger(body.orderID) || body.orderID <= 0)
      throw new CommerceError("Comandă invalidă.");
    return Response.json(
      await generateProductionPayment(
        body.orderID,
        { unitPrices: body.unitPrices, shipping: body.shipping },
        undefined,
        cms,
      ),
    );
  } catch (error) {
    if (error instanceof CommerceError)
      return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof SyntaxError)
      return Response.json({ error: "Solicitare invalidă." }, { status: 400 });
    return Response.json(
      {
        error:
          "Linkul nu a putut fi generat. Reîncearcă fără să modifici prețurile.",
      },
      { status: 502 },
    );
  }
}
