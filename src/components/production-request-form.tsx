"use client";
import { useRef, useState } from "react";
import { Check, ArrowUpRight } from "lucide-react";
import type { CartLine } from "./cart-provider";

/** Keep identical submissions on one retry key; requests are saved without taking payment. */
export default function ProductionRequestForm({
  items,
  onComplete,
}: {
  items: CartLine[];
  onComplete: (snapshot: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const request = useRef<{
    fingerprint: string;
    key: string;
    snapshot: string;
  } | null>(null);
  const busy = useRef(false);
  if (status === "sent")
    return (
      <div className="production-request-success" role="status">
        <Check size={22} />
        <strong>Comanda a fost înregistrată.</strong>
        <p>
          Te contactăm telefonic pentru confirmarea prețului și a termenului.
          Vei primi linkul de plată după discuție, iar pregătirea începe după
          plata confirmată.
        </p>
        <p>Referință: {reference}</p>
        <button
          type="button"
          className="primary-button cart-phone"
          onClick={() => onComplete(request.current!.snapshot)}
        >
          Continuă cumpărăturile <ArrowUpRight size={18} />
        </button>
      </div>
    );
  return (
    <form
      className="production-request-form"
      aria-busy={status === "sending"}
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy.current) return;
        busy.current = true;
        const values = Object.fromEntries(new FormData(event.currentTarget));
        const data = { ...values, items };
        const fingerprint = JSON.stringify(data);
        setStatus("sending");
        setError("");
        try {
          if (request.current?.fingerprint !== fingerprint) {
            const bytes = crypto.getRandomValues(new Uint8Array(16));
            bytes[6] = (bytes[6] & 15) | 64;
            bytes[8] = (bytes[8] & 63) | 128;
            const hex = Array.from(bytes, (b) =>
              b.toString(16).padStart(2, "0"),
            ).join("");
            request.current = {
              fingerprint,
              key: `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`,
              snapshot: JSON.stringify(items),
            };
          }
          const response = await fetch("/api/orders/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, key: request.current.key }),
          });
          const result = await response.json();
          if (!response.ok || !result.reference)
            throw new Error(
              result.error || "Comanda nu a putut fi înregistrată.",
            );
          setReference(result.reference);
          setStatus("sent");
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Verifică conexiunea și reîncearcă.",
          );
          setStatus("idle");
        } finally {
          busy.current = false;
        }
      }}
    >
      <h3>Comandă la cerere</h3>
      <p>
        Unele produse necesită pregătire sau confirmarea prețului. Întreaga
        comandă va fi confirmată telefonic. Nu plătești acum.
      </p>
      <fieldset disabled={status === "sending"}>
        <label htmlFor="production-name">Nume *</label>
        <input
          id="production-name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
        />
        <label htmlFor="production-phone">Telefon *</label>
        <input
          id="production-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          minLength={7}
          maxLength={40}
        />
        <label htmlFor="production-email">E-mail *</label>
        <input
          id="production-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
        />
        <label htmlFor="production-note">Detalii suplimentare</label>
        <textarea id="production-note" name="note" rows={2} maxLength={1500} />
        <div className="contact-trap" aria-hidden="true">
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-label="Website"
          />
        </div>
      </fieldset>
      <p>
        Folosim datele completate pentru confirmarea și gestionarea comenzii.
      </p>
      {error && (
        <p className="checkout-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="primary-button cart-phone"
        type="submit"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Se înregistrează…" : "Înregistrează comanda"}
        <ArrowUpRight size={18} />
      </button>
    </form>
  );
}
