'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Clock } from 'lucide-react';
import { useCart } from './cart-provider';
import { useCatalog } from './catalog-provider';

export default function CheckoutResult({ paid, cancelled, reference }: { paid: boolean; cancelled: boolean; reference?: string }) {
  const { items, clear } = useCart();
  const { refresh } = useCatalog();
  useEffect(() => {
    const key = sessionStorage.getItem('makeon-checkout-key');
    if (!cancelled || !key) return;
    fetch('/api/checkout/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) })
      .then(response => { if (response.ok) { sessionStorage.removeItem('makeon-checkout-key'); refresh(); } }).catch(() => {});
  }, [cancelled]);
  useEffect(() => {
    if (!paid) return;
    const snapshot = sessionStorage.getItem('makeon-checkout-cart');
    // Don't erase a new selection created in another tab while payment was open.
    if (snapshot && JSON.stringify(items) === snapshot) {
      clear(); sessionStorage.removeItem('makeon-checkout-cart');
      sessionStorage.removeItem('makeon-checkout-key');
    }
  }, [paid, items, clear]);
  return <section className="checkout-result section-padding">
    {paid ? <Check size={36} /> : <Clock size={36} />}
    <h1>{paid ? 'Mulțumim pentru comandă.' : cancelled ? 'Coșul tău te așteaptă.' : 'Verificăm plata ta.'}</h1>
    <p>{paid ? 'Plata a fost confirmată. Am înregistrat comanda și datele de livrare.'
      : cancelled ? 'Plata nu a fost finalizată. Produsele rămân în coș. Eliberăm rezervarea, astfel încât să poți modifica selecția și să reîncerci.'
      : 'Confirmarea poate dura câteva momente. Reîncarcă pagina pentru a verifica statusul. Dacă ai fost debitat, nu repeta plata.'}</p>
    {paid && reference && <p>Referință comandă: <strong>{reference}</strong></p>}
    <Link className="primary-button" href="/cafea">Înapoi la cafele<ArrowUpRight size={18} /></Link>
  </section>;
}
