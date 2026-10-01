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
import { money, productBySlug } from "@/lib/coffee-catalog";
import CoffeePack from "./coffee-pack";

export type CartLine = { slug: string; grind: string; quantity: number };
type CartContextValue = {
  items: CartLine[];
  add: (slug: string, grind: string, quantity?: number) => void;
  open: () => void;
  count: number;
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
  const [items, setItems] = useState<CartLine[]>([]),
    [loaded, setLoaded] = useState(false),
    [opened, setOpened] = useState(false),
    [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
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
                !!productBySlug(v.slug) &&
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
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (opened) {
      el.showModal();
      document.body.style.overflow = "hidden";
    } else {
      el.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [opened]);
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
  }, []);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const completePrices =
    items.length > 0 &&
    items.every((i) => productBySlug(i.slug)?.price != null);
  const total = items.reduce(
    (sum, i) => sum + (productBySlug(i.slug)?.price ?? 0) * i.quantity,
    0,
  );
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
        const p = productBySlug(i.slug)!;
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
        onCancel={() => setOpened(false)}
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
                  const p = productBySlug(line.slug)!;
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
                  {completePrices
                    ? "Livrarea și disponibilitatea se confirmă la comandă."
                    : "Solicită prețurile și disponibilitatea pentru cafelele alese."}
                </p>
                <button className="copy-selection" onClick={copySelection}>
                  {copied ? <Check size={16} /> : <ShoppingBag size={16} />}{" "}
                  {copied ? "Selecție copiată" : "Copiază selecția"}
                </button>
                <a
                  className="primary-button cart-phone"
                  href="tel:+40744524728"
                >
                  <Phone size={17} />
                  Solicită oferta
                  <ArrowUpRight size={18} />
                </a>
                <span className="cart-summary-note">
                  +40 744 524 728 · Nicio comandă nu este trimisă automat.
                </span>
              </div>
            </>
          )}
        </div>
      </dialog>
    </CartContext.Provider>
  );
}
