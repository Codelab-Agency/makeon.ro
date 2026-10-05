"use client";

import { useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import CustomSelect from "./custom-select";
import { serviceOptions } from "@/lib/service-options";
import { legal } from "@/lib/legal";

const teams = [
  "1–10 persoane",
  "11–30 persoane",
  "31–75 persoane",
  "76–150 persoane",
  "Peste 150 persoane",
];
/** Preserve the request ID and inputs after an uncertain send so the same request can be retried. */
export default function ContactRequestForm({
  interest,
  onInterestChange,
}: {
  interest: string;
  onInterestChange: (value: string) => void;
}) {
  const [team, setTeam] = useState(teams[1]);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const requestId = useRef<string | null>(null);
  const busy = useRef(false);
  if (status === "sent")
    return (
      <div className="contact-summary" role="status">
        <Check size={20} />
        <div>
          <strong>Solicitarea a fost trimisă.</strong>
          <p>
            Mulțumim! Echipa Makeon te va contacta folosind datele completate.
          </p>
          <button
            type="button"
            className="text-link"
            onClick={() => {
              requestId.current = null;
              setStatus("idle");
            }}
          >
            Trimite o altă solicitare <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  return (
    <>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy.current) return;
          busy.current = true;
          setStatus("sending");
          setError("");
          const form = new FormData(event.currentTarget);
          try {
            requestId.current ??=
              typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : "10000000-1000-4000-8000-100000000000".replace(
                    /[018]/g,
                    (digit) =>
                      (
                        Number(digit) ^
                        (crypto.getRandomValues(new Uint8Array(1))[0] &
                          (15 >> (Number(digit) / 4)))
                      ).toString(16),
                  );
            const response = await fetch("/api/contact", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...Object.fromEntries(form),
                interest,
                team,
                requestId: requestId.current,
              }),
            });
            const result = await response.json();
            if (!response.ok || result.ok !== true)
              throw new Error(
                result.error || "Solicitarea nu a putut fi trimisă.",
              );
            setStatus("sent");
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Verifică conexiunea și încearcă din nou.",
            );
            setStatus("error");
          } finally {
            busy.current = false;
          }
        }}
        aria-busy={status === "sending"}
      >
        <fieldset disabled={status === "sending"} className="contact-fields">
          <label htmlFor="contact-name">Nume *</label>
          <input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
          />
          <label htmlFor="contact-company">
            Companie <span>(opțional)</span>
          </label>
          <input
            id="contact-company"
            name="company"
            autoComplete="organization"
            maxLength={160}
          />
          <label htmlFor="contact-email">E-mail *</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
          <label htmlFor="contact-phone">
            Telefon <span>(opțional)</span>
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
          />
          <label htmlFor="interest">Ce soluție cauți?</label>
          <CustomSelect
            id="interest"
            label="Ce soluție cauți?"
            value={interest}
            onChange={onInterestChange}
            options={serviceOptions.map((value) => ({ value, label: value }))}
          />
          <label htmlFor="team">Câți oameni sunt în echipă?</label>
          <CustomSelect
            id="team"
            label="Câți oameni sunt în echipă?"
            value={team}
            onChange={setTeam}
            options={teams.map((value) => ({ value, label: value }))}
          />
          <label htmlFor="contact-message">
            Mesaj <span>(opțional)</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={3}
            maxLength={3000}
          />
          <div className="contact-trap" aria-hidden="true">
            <label htmlFor="contact-website">Website</label>
            <input
              id="contact-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
        </fieldset>
        {error && (
          <p className="contact-error" role="alert">
            {error}
          </p>
        )}
        <p className="contact-data-note">
          Folosim datele completate pentru a răspunde solicitării tale.{" "}
          <a href={legal.privacy} target="_blank" rel="noopener noreferrer">
            Politica de confidențialitate
          </a>
          .
        </p>
        <button
          type="submit"
          className="primary-button"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Se trimite…" : "Solicită o ofertă"}
          <ArrowRight size={18} />
        </button>
      </form>
      <a
        className="text-link contact-whatsapp"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://wa.me/40744524728?text=${encodeURIComponent(`Bună! Mă interesează: ${interest}. Echipa: ${team}. Aș dori o ofertă Makeon.`)}`}
      >
        Preferi WhatsApp? <ArrowUpRight size={15} />
      </a>
    </>
  );
}
