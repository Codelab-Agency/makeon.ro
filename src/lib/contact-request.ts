import "server-only";
import { createHash } from "node:crypto";
import { serviceOptions } from "./service-options";

export const teamOptions = [
  "1–10 persoane",
  "11–30 persoane",
  "31–75 persoane",
  "76–150 persoane",
  "Peste 150 persoane",
];
export class ContactError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
/** Validate allowed choices and header-safe single-line fields at the server boundary. */
export function parseContact(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ContactError("Solicitare invalidă.");
  const data = value as Record<string, unknown>;
  const field = (key: string, max: number, required = false) => {
    if (data[key] != null && typeof data[key] !== "string")
      throw new ContactError("Verifică datele introduse.");
    const text = String(data[key] ?? "").trim();
    if (
      (required && !text) ||
      text.length > max ||
      (key !== "message" && /[\r\n\x00]/.test(text))
    )
      throw new ContactError("Verifică datele introduse.");
    return text;
  };
  const name = field("name", 100, true),
    email = field("email", 254, true);
  if (name.length < 2 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email))
    throw new ContactError("Introdu un nume și o adresă de e-mail valide.");
  const interest = field("interest", 150, true),
    team = field("team", 50, true);
  if (!serviceOptions.includes(interest) || !teamOptions.includes(team))
    throw new ContactError("Alege soluția și dimensiunea echipei din listă.");
  const requestId = field("requestId", 36, true);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      requestId,
    )
  )
    throw new ContactError("Reîncarcă formularul și încearcă din nou.");
  return {
    name,
    email,
    interest,
    team,
    requestId,
    company: field("company", 160),
    phone: field("phone", 40),
    message: field("message", 3000),
  };
}
const escapeHTML = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
/** Escape customer content for HTML; Reply-To lets staff answer the requester directly. */
export function contactEmail(data: ReturnType<typeof parseContact>) {
  const rows = [
    ["Nume", data.name],
    ["Companie", data.company || "—"],
    ["E-mail", data.email],
    ["Telefon", data.phone || "—"],
    ["Soluție", data.interest],
    ["Echipă", data.team],
    ["Mesaj", data.message || "—"],
  ];
  return {
    subject: `Makeon · Solicitare ofertă · ${data.interest}`,
    reply_to: data.email,
    text: `Solicitare nouă de ofertă Makeon\n\n${rows.map(([label, value]) => `${label}: ${value}`).join("\n\n")}`,
    html: `<div style="font-family:Arial,sans-serif;color:#26372c;max-width:620px;margin:auto"><h1 style="font-size:24px">Solicitare nouă de ofertă</h1><p>Primite prin formularul Makeon.</p><table style="border-collapse:collapse;width:100%">${rows.map(([label, value]) => `<tr><th style="text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid #dee5d9;width:100px">${label}</th><td style="padding:12px;border-bottom:1px solid #dee5d9;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHTML(value)}</td></tr>`).join("")}</table><p style="font-size:12px;color:#75836f">Răspunde la acest e-mail pentru a contacta solicitantul.</p></div>`,
  };
}
/**
 * Send using server credentials and a configured recipient, never a client destination.
 * UUID + content hash deduplicate identical retries within Resend's 24-hour window.
 * Provider acceptance is not proof of inbox delivery.
 */
export async function sendContact(
  data: ReturnType<typeof parseContact>,
  fetcher: typeof fetch = fetch,
) {
  const key = process.env.RESEND_API_KEY,
    from = process.env.RESEND_FROM_EMAIL,
    to = process.env.CONTACT_EMAIL_TO;
  if (!key || !from || !to)
    throw new ContactError(
      "Formularul nu este disponibil momentan. Ne poți contacta telefonic sau pe WhatsApp.",
      503,
    );
  const message = contactEmail(data);
  const hash = createHash("sha256")
    .update(JSON.stringify(message))
    .digest("hex");
  let response: Response;
  try {
    response = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `makeon-contact/${data.requestId}/${hash}`,
      },
      body: JSON.stringify({ from, to: [to], ...message }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ContactError(
      "Nu am putut confirma trimiterea. Încearcă din nou sau contactează-ne pe WhatsApp.",
      502,
    );
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || typeof result?.id !== "string") {
    // Do not expose provider responses, credentials or customer data.
    console.error("Contact email provider rejected request", response.status);
    throw new ContactError(
      "Solicitarea nu a putut fi trimisă. Încearcă din nou sau contactează-ne pe WhatsApp.",
      502,
    );
  }
}
