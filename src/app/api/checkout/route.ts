import { createCheckout, parseLines, CommerceError } from "@/lib/commerce";
import { checkoutConfigured } from "@/lib/commerce-env";
import { requireLegalAcceptance } from "@/lib/commerce-validation";

export const runtime = "nodejs";
/** Validate browser input; the commerce service owns pricing and inventory locks. */
export async function POST(request: Request) {
  if (!checkoutConfigured())
    return Response.json(
      { error: "Plata online nu este încă disponibilă." },
      { status: 503 },
    );
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(process.env.APP_URL!).origin)
    return Response.json({ error: "Cerere neautorizată." }, { status: 403 });
  try {
    const text = await request.text();
    if (text.length > 16000) throw new CommerceError("Coș prea mare.");
    const body = JSON.parse(text);
    const legalVersion = requireLegalAcceptance(body);
    if (
      typeof body.key !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        body.key,
      )
    )
      throw new CommerceError("Identificator de plată invalid.");
    return Response.json(
      await createCheckout(
        parseLines(body),
        body.key,
        undefined,
        undefined,
        legalVersion,
      ),
    );
  } catch (error) {
    if (error instanceof CommerceError)
      return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof SyntaxError)
      return Response.json({ error: "Coș invalid." }, { status: 400 });
    console.error(
      "Checkout failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return Response.json(
      { error: "Nu am putut deschide plata. Reîncearcă în câteva momente." },
      { status: 502 },
    );
  }
}
