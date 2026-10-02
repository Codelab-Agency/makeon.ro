import { createHash } from "node:crypto";
import { ContactError, parseContact, sendContact } from "@/lib/contact-request";

export const runtime = "nodejs";
// Best-effort per-instance throttle; not a distributed rate limit on Vercel.
const attempts = new Map<string, { count: number; until: number }>();
/** Public contact boundary: origin checks, bounded input, honeypot and email submission. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = [
    new URL(request.url).origin,
    process.env.APP_URL,
    ...(process.env.ADMIN_ALLOWED_ORIGINS || "").split(","),
  ].filter(Boolean);
  if (!origin || !allowed.includes(origin))
    return Response.json({ error: "Solicitare nepermisă." }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: "Format invalid." }, { status: 415 });
  try {
    if (Number(request.headers.get("content-length")) > 12000)
      throw new ContactError("Mesajul este prea lung.", 413);
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 12000)
      throw new ContactError("Mesajul este prea lung.", 413);
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new ContactError("Solicitare invalidă.");
    }
    if (body && typeof body === "object" && "website" in body && body.website)
      throw new ContactError("Solicitare nepermisă.", 400);
    const data = parseContact(body);
    const now = Date.now();
    for (const [key, value] of attempts)
      if (value.until <= now) attempts.delete(key);
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const key = createHash("sha256").update(ip).digest("hex");
    const rate = attempts.get(key) || { count: 0, until: now + 10 * 60 * 1000 };
    if (rate.count >= 5)
      throw new ContactError(
        "Ai trimis prea multe solicitări. Încearcă din nou în câteva minute.",
        429,
      );
    if (attempts.size >= 5000) attempts.delete(attempts.keys().next().value!);
    rate.count++;
    attempts.set(key, rate);
    await sendContact(data);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof ContactError)
      return Response.json({ error: error.message }, { status: error.status });
    return Response.json(
      { error: "Solicitarea nu a putut fi trimisă. Încearcă din nou." },
      { status: 500 },
    );
  }
}
