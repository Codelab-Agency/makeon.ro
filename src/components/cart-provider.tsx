"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Minus,
  Phone,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { money } from "@/lib/coffee-catalog";
import { useCatalog } from "./catalog-provider";
import CoffeePack from "./coffee-pack";
import useDialogMotion from "./use-dialog-motion";

export type CartLine = { slug: string; grind: string; quantity: number };
type CartContextValue = {
  items: CartLine[];
  add: (slug: string, grind: string, quantity?: number) => void;
  open: () => void;
  count: number;
  clear: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "makeon-coffee-cart-v1";
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("CartProvider is required");
  return context;
}

export function CartButton() {
  const { count, open } = useCart();
  return (
    <button
      className="cart-button"
      onClick={open}
      aria-label={`Deschide coșul de cafea (${count})`}
    >
      <ShoppingBag size={19} />
      <span>{count}</span>
    </button>
  );
}

export default function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const catalog = useCatalog();
  const productBySlug = useCallback((slug: string) => catalog.products.find(p => p.slug === slug), [catalog.products]);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const checkoutKey = useRef<{ fingerprint: string; key: string } | null>(null);
  const [items, setItems] = useState<CartLine[]>([]),
    [loaded, setLoaded] = useState(false),
    [opened, setOpened] = useState(false),
    [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useDialogMotion(dialog, opened, "cart");
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(saved))
        setItems(
          saved
            .filter((item: unknown): item is CartLine => {
              if (!item || typeof item !== "object") return false;
              const v = item as CartLine;
              return (
                typeof v.slug === "string" &&
                /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.slug) &&
                typeof v.grind === "string" &&
                ["Boabe", "Ibric", "Moka", "Espresso", "Instant"].includes(
                  v.grind,
                ) &&
                Number.isInteger(v.quantity) &&
                v.quantity > 0 &&
                v.quantity <= 99
              );
            })
            .slice(0, 100),
        );
    } catch {
      /* An unavailable store must not prevent shopping. */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(items));
      } catch {
        /* Keep the current in-memory selection. */
      }
    }
  }, [items, loaded]);
  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );
  const add = useCallback((slug: string, grind: string, quantity = 1) => {
    const product = productBySlug(slug);
    if (!product) return;
    const qty = Math.max(1, Math.min(99, Math.floor(quantity)));
    setItems((previous) => {
      const found = previous.find((i) => i.slug === slug && i.grind === grind);
      return found
        ? previous.map((i) =>
            i === found
              ? { ...i, quantity: Math.min(99, i.quantity + qty) }
              : i,
          )
        : [...previous, { slug, grind, quantity: qty }];
    });
    setNotice(`${product.name} a fost adăugată în coș.`);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 3500);
  }, [productBySlug]);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const completePrices =
    items.length > 0 &&
    items.every((i) => productBySlug(i.slug)?.price != null);
  const total = items.reduce(
    (sum, i) => sum + (productBySlug(i.slug)?.price ?? 0) * i.quantity,
    0,
  );
  const canPay = catalog.checkout && completePrices && items.every(i => {
    const p = productBySlug(i.slug);
    const quantity = items.filter(line => line.slug === i.slug).reduce((sum, line) => sum + line.quantity, 0);
    return (checkoutKey.current?.fingerprint === JSON.stringify(items)) || (p?.stock != null && p.stock >= quantity);
  });
  async function pay() {
    if (paying || !canPay) return;
    setPaying(true); setPaymentError("");
    const fingerprint = JSON.stringify(items);
    if (!checkoutKey.current || checkoutKey.current.fingerprint !== fingerprint)
      checkoutKey.current = { fingerprint, key: crypto.randomUUID() };
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, key: checkoutKey.current.key }) });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) checkoutKey.current = null;
        throw new Error(data.error || 'Nu am putut deschide plata.');
      }
      sessionStorage.setItem('makeon-checkout-cart', fingerprint);
      sessionStorage.setItem('makeon-checkout-key', checkoutKey.current.key);
      window.location.assign(data.url);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Reîncearcă plata.');
      catalog.refresh(); setPaying(false);
    }
  }
  const changeQuantity = (line: CartLine, value: number) =>
    setItems((previous) =>
      previous.map((i) =>
        i.slug === line.slug && i.grind === line.grind
          ? { ...i, quantity: Math.min(99, Math.max(1, value)) }
          : i,
      ),
    );
  const remove = (line: CartLine) =>
    setItems((previous) =>
      previous.filter((i) => !(i.slug === line.slug && i.grind === line.grind)),
    );
  async function copySelection() {
    const summary = [
      "Selecție cafea Makeon / SwitchMorn",
      ...items.map((i) => {
        const p = productBySlug(i.slug);
        if (!p) return `${i.quantity} × ${i.slug} — indisponibil`;
        return `${i.quantity} × ${p.name}, ${p.grams} g, ${i.grind}`;
      }),
      completePrices
        ? `Total produse: ${money(total)}`
        : "Vă rog să confirmați prețurile și disponibilitatea.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <CartContext.Provider
      value={{
        items,
        add,
        count,
        clear: () => setItems([]),
        open: () => {
          setCopied(false);
          setOpened(true);
        },
      }}
    >
      {children}
      {notice && (
        <div className="cart-toast" role="status">
          <Check size={17} />
          <span>{notice}</span>
          <button
            onClick={() => {
              setOpened(true);
              setNotice("");
            }}
          >
            Vezi coșul
            <ArrowUpRight size={15} />
          </button>
        </div>
      )}
      <dialog
        className="cart-drawer"
        ref={dialog}
        aria-label="Coșul de cafea"
        onCancel={(event) => {
          event.preventDefault();
          setOpened(false);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpened(false);
        }}
      >
        <div className="cart-drawer-inner">
          <div className="cart-drawer-top">
            <div>
              <span className="eyebrow">SWITCHMORN COFFEE</span>
              <h2>
                Coșul tău <span>({count})</span>
              </h2>
            </div>
            <button
              className="cart-close"
              onClick={() => setOpened(false)}
              aria-label="Închide coșul"
            >
              <X />
            </button>
          </div>
          {items.length === 0 ? (
            <div className="empty-cart">
              <ShoppingBag size={49} />
              <h3>Un ritual bun începe cu alegerea ta.</h3>
              <p>Descoperă cafelele și adaugă preferatele în coș.</p>
              <Link
                className="primary-button"
                href="/cafea"
                onClick={() => setOpened(false)}
              >
                Explorează cafelele
                <ArrowUpRight size={17} />
              </Link>
            </div>
          ) : (
            <>
              <div className="cart-lines">
                {items.map((line) => {
                  const p = productBySlug(line.slug);
                  if (!p) return <article className="cart-line" key={`${line.slug}-${line.grind}`}><div className="cart-line-copy"><p>Produs indisponibil: {line.slug}</p><button onClick={() => remove(line)}>Elimină din coș</button></div></article>;
                  return (
                    <article
                      className="cart-line"
                      key={`${line.slug}-${line.grind}`}
                    >
                      <Link
                        className="cart-line-art"
                        href={`/cafea/${line.slug}`}
                        onClick={() => setOpened(false)}
                      >
                        <CoffeePack product={p} />
                      </Link>
                      <div className="cart-line-copy">
                        <Link
                          href={`/cafea/${line.slug}`}
                          onClick={() => setOpened(false)}
                        >
                          {p.name}
                        </Link>
                        <span>
                          {p.grams === 1000 ? "1 kg" : `${p.grams} g`} ·{" "}
                          {line.grind}
                        </span>
                        <small>
                          {p.price == null ? "Preț la cerere" : money(p.price)}
                        </small>
                        <div className="cart-line-controls">
                          <div className="quantity-control">
                            <button
                              aria-label={`Scade cantitatea ${p.name}`}
                              onClick={() =>
                                changeQuantity(line, line.quantity - 1)
                              }
                              disabled={line.quantity <= 1}
                            >
                              <Minus size={13} />
                            </button>
                            <span>{line.quantity}</span>
                            <button
                              aria-label={`Crește cantitatea ${p.name}`}
                              onClick={() =>
                                changeQuantity(line, line.quantity + 1)
                              }
                              disabled={line.quantity >= 99}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <button
                            className="remove-line"
                            aria-label={`Elimină ${p.name}, ${line.grind}`}
                            onClick={() => remove(line)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="cart-summary">
                <div className="cart-summary-total">
                  <span>
                    {completePrices ? "Total produse" : "Selecția ta"}
                  </span>
                  <strong>
                    {completePrices
                      ? money(total)
                      : `${count} ${count === 1 ? "produs" : "produse"}`}
                  </strong>
                </div>
                <p>
                  {catalog.checkout && completePrices ? `Transport: ${money((catalog.shippingBani ?? 0) / 100)}. Total: ${money(total + (catalog.shippingBani ?? 0) / 100)}.` : completePrices
                    ? "Livrarea și disponibilitatea se confirmă la comandă."
                    : "Solicită prețurile și disponibilitatea pentru cafelele alese."}
                </p>
                <button className="copy-selection" onClick={copySelection}>
                  {copied ? <Check size={16} /> : <ShoppingBag size={16} />}{" "}
                  {copied ? "Selecție copiată" : "Copiază selecția"}
                </button>
                {catalog.checkout && completePrices ? <button className="primary-button cart-phone" disabled={!canPay || paying} onClick={pay}>
                  {paying ? 'Deschidem plata…' : 'Plătește prin Stripe'}<ArrowUpRight size={18} />
                </button> : <a
                  className="primary-button cart-phone"
                  href="tel:+40744524728"
                >
                  <Phone size={17} />
                  Solicită oferta
                  <ArrowUpRight size={18} />
                </a>}
                {catalog.checkout && completePrices && !canPay && <p className="checkout-error">Verifică disponibilitatea și cantitățile din coș.</p>}
                {paymentError && <p className="checkout-error" role="alert">{paymentError}</p>}
                <span className="cart-summary-note">
                  {catalog.checkout && completePrices ? 'Plata este procesată securizat de Stripe.' : '+40 744 524 728 · Nicio comandă nu este trimisă automat.'}
                </span>
              </div>
            </>
          )}
        </div>
      </dialog>
    </CartContext.Provider>
  );
}
