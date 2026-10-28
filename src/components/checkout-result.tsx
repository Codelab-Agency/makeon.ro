"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Clock } from "lucide-react";
import { useCart } from "./cart-provider";
import { useCatalog } from "./catalog-provider";

export default function CheckoutResult({
  paid: confirmedPaid,
  cancelled,
  reference: confirmedReference,
  production = false,
}: {
  paid: boolean;
  cancelled: boolean;
  reference?: string;
  production?: boolean;
}) {
  const { items, clear } = useCart();
  const { refresh } = useCatalog();
  const [settled, setSettled] = useState<{ paid: boolean; reference?: string }>({ paid: false });
  const [cancelState, setCancelState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [cancelAttempt, setCancelAttempt] = useState(0);
  const cancelInFlight = useRef(false);
  const paid = confirmedPaid || settled.paid;
  const reference = confirmedReference || settled.reference;
  useEffect(() => {
    const key = sessionStorage.getItem("makeon-checkout-key");
    if (!cancelled || !key || production || cancelInFlight.current) return;
    cancelInFlight.current = true; setCancelState('loading');
    fetch("/api/checkout/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    })
      .then(async (response) => {
        if (response.ok) {
          const result = await response.json();
          if (result.paid) setSettled({ paid: true, reference: result.reference });
          if (sessionStorage.getItem("makeon-checkout-key") === key) {
            sessionStorage.removeItem("makeon-checkout-key");
            if (!result.paid) sessionStorage.removeItem("makeon-checkout-cart");
          }
          setCancelState('done');
          refresh();
        } else throw new Error('Cancellation could not be confirmed');
      })
      .catch(() => setCancelState('error'))
      .finally(() => { cancelInFlight.current = false; });
  }, [cancelled, production, cancelAttempt]);
  useEffect(() => {
    if (!paid || production) return;
    const snapshot = sessionStorage.getItem("makeon-checkout-cart");
    // Don't erase a new selection created in another tab while payment was open.
    if (snapshot && JSON.stringify(items) === snapshot) {
      clear();
      sessionStorage.removeItem("makeon-checkout-cart");
      sessionStorage.removeItem("makeon-checkout-key");
    }
  }, [paid, production, items, clear]);
  return (
    <section className="checkout-result section-padding">
      {paid ? <Check size={36} /> : <Clock size={36} />}
      <h1>
        {paid
          ? "Mulțumim pentru comandă."
          : cancelled
            ? production
              ? "Comanda ta te așteaptă."
              : "Coșul tău te așteaptă."
            : "Verificăm plata ta."}
      </h1>
      <p>
        {paid
          ? production
            ? "Plata a fost confirmată. Echipa Makeon poate începe pregătirea produselor conform discuției telefonice."
            : "Plata a fost confirmată. Am înregistrat comanda și datele de livrare."
          : cancelled && production
            ? "Plata nu a fost finalizată. Comanda rămâne înregistrată; poți reveni la linkul primit cât timp acesta este valabil sau poți contacta echipa Makeon."
            : cancelled
              ? "Ai revenit din pagina de plată. Produsele rămân în coș; verificăm sesiunea și eliberăm rezervarea dacă plata nu a fost finalizată."
              : "Confirmarea poate dura câteva momente. Reîncarcă pagina pentru a verifica statusul. Dacă ai fost debitat, nu repeta plata."}
      </p>
      {!paid && cancelState === 'done' && <p role="status">Rezervarea a fost eliberată. Nu a fost înregistrată o comandă.</p>}
      {!paid && cancelState === 'error' && <div><p role="alert">Nu am putut confirma eliberarea rezervării. Reîncearcă verificarea înainte de o nouă plată.</p><button className="text-link" onClick={() => setCancelAttempt(value => value + 1)}>Reîncearcă verificarea</button></div>}
      {paid && reference && (
        <p>
          Referință comandă: <strong>{reference}</strong>
        </p>
      )}
      <Link className="primary-button" href="/cafea">
        Înapoi la cafele
        <ArrowUpRight size={18} />
      </Link>
    </section>
  );
}
