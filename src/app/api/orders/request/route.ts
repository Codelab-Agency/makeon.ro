import { createHash } from "node:crypto";
import {
  createProductionRequest,
  parseProductionRequest,
} from "@/lib/production-orders";
import {
  CommerceError,
  requireLegalAcceptance,
} from "@/lib/commerce-validation";
import { cmsConfigured } from "@/lib/commerce-env";
import { allowedRequestOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";
// Best-effort per-instance spam control. This is not a distributed Vercel limiter.
const requests = new Map<string, { count: number; expires: number }>();
export async function POST(request: Request) {
  if (!cmsConfigured())
    return Response.json(
      { error: "Comenzile nu sunt disponibile momentan." },
      { status: 503 },
    );
  if (!allowedRequestOrigin(request))
    return Response.json({ error: "Solicitare nepermisă." }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: "Format invalid." }, { status: 415 });
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 16000)
      throw new CommerceError("Solicitare prea mare.", 413);
    const body = JSON.parse(raw);
    const legalVersion = requireLegalAcceptance(body);
    const input = { ...parseProductionRequest(body), legalVersion };
    const now = Date.now();
    for (const [key, value] of requests)
      if (value.expires <= now) requests.delete(key);
    const ip = createHash("sha256")
      .update(
        request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown",
      )
      .digest("hex");
    const rate = requests.get(ip) ?? {
      count: 0,
      expires: now + 10 * 60 * 1000,
    };
    if (rate.count >= 5)
      throw new CommerceError(
        "Prea multe solicitări. Încearcă din nou în câteva minute.",
        429,
      );
    if (requests.size >= 5000) requests.delete(requests.keys().next().value!);
    rate.count++;
    requests.set(ip, rate);
    return Response.json(await createProductionRequest(input));
  } catch (error) {
    if (error instanceof CommerceError)
      return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof SyntaxError)
      return Response.json({ error: "Solicitare invalidă." }, { status: 400 });
    return Response.json(
      { error: "Comanda nu a putut fi înregistrată. Încearcă din nou." },
      { status: 502 },
    );
  }
}
