"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Coffee,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";
import {
  categoryLabel,
  coffeeProducts,
  money,
  type CoffeeProduct,
} from "@/lib/coffee-catalog";
import CoffeePack from "./coffee-pack";
import CustomSelect from "./custom-select";
import { useCart } from "./cart-provider";
import { CoffeeProductCard } from "./coffee-shop";

export default function CoffeeDetail({ product }: { product: CoffeeProduct }) {
  const [quantity, setQuantity] = useState(1),
    [grind, setGrind] = useState(
      product.category === "boabe"
        ? "Boabe"
        : product.category === "macinata"
          ? "Espresso"
          : "Instant",
    );
  const { add } = useCart();
  const specs = [
    ["Format", categoryLabel(product.category)],
    ["Cantitate", product.grams === 1000 ? "1 kg" : `${product.grams} g`],
    ["Origine", product.origin],
    ["Altitudine", product.altitude],
    ["Varietate", product.variety],
    ["Procesare", product.processing],
    ["Prăjire", product.roast],
  ].filter((row): row is [string, string] => !!row[1]);
  const related = coffeeProducts
    .filter((p) => p.slug !== product.slug && p.category === product.category)
    .slice(0, 3);
  return (
    <>
      <div className="product-breadcrumb section-padding">
        <Link href="/cafea">
          <ArrowLeft size={15} />
          Toate cafelele
        </Link>
        <span>SwitchMorn / {product.name}</span>
      </div>
      <section className="coffee-detail section-padding">
        <div className="detail-visual">
          <span className="eyebrow">{product.collection}</span>
          <CoffeePack product={product} />
          <span className="detail-visual-caption">
            Reprezentare de prezentare a ambalajului
          </span>
        </div>
        <div className="detail-copy">
          <span className="eyebrow">
            SWITCHMORN COFFEE / {categoryLabel(product.category)}
          </span>
          <h1>{product.name}</h1>
          <div className="detail-notes">
            {product.notes.map((note) => (
              <span key={note}>{note}</span>
            ))}
          </div>
          <p className="detail-description">{product.description}</p>
          <div className="detail-price">
            {product.price == null ? "Preț la cerere" : money(product.price)}
            <small>
              {product.price == null
                ? "Solicită prețul și disponibilitatea pentru această cafea."
                : "Preț pe ambalaj, cu TVA inclus."}
            </small>
          </div>
          <div className="detail-options">
            <div>
              <label>Cantitate / ambalaj</label>
              <span className="pack-size-option">
                {product.grams === 1000 ? "1 kg" : `${product.grams} g`}
              </span>
            </div>
            <div>
              <label htmlFor="grind">
                {product.category === "macinata" ? "Măcinare pentru" : "Format"}
              </label>
              {product.category === "macinata" ? (
                <CustomSelect
                  id="grind"
                  label="Măcinare pentru"
                  value={grind}
                  onChange={setGrind}
                  options={["Ibric", "Moka", "Espresso"].map((value) => ({
                    value,
                    label: value,
                  }))}
                />
              ) : (
                <span className="pack-size-option">{grind}</span>
              )}
            </div>
          </div>
          <div className="detail-add-row">
            <div className="quantity-control">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                aria-label="Scade cantitatea"
              >
                <Minus size={16} />
              </button>
              <label className="sr-only" htmlFor="product-quantity">
                Număr de ambalaje
              </label>
              <input
                id="product-quantity"
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.max(1, Math.min(99, Number(e.target.value) || 1)),
                  )
                }
              />
              <button
                onClick={() => setQuantity(Math.min(99, quantity + 1))}
                disabled={quantity >= 99}
                aria-label="Crește cantitatea"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              className="primary-button"
              onClick={() => add(product.slug, grind, quantity)}
            >
              Adaugă în coș
              <ShoppingBag size={18} />
            </button>
          </div>
          <p className="detail-order-note">
            Adaugă cafelele preferate și solicită oferta pentru selecția ta.
          </p>
          <div className="detail-ritual">
            <Coffee size={19} />
            <span>
              {product.category === "macinata"
                ? "Măcinată pentru ibric, moka sau espresso."
                : product.category === "boabe"
                  ? "Cafea boabe. Măcinarea face parte din ritual."
                  : "Un ritual simplu, cu apă sau lapte."}
            </span>
          </div>
        </div>
      </section>
      <section className="detail-specs section-padding">
        <div>
          <span className="eyebrow">CUNOAȘTE-ȚI CAFEAUA</span>
          <h2>
            Fiecare origine
            <br />
            are povestea ei.
          </h2>
          <p>
            Detaliile produsului sunt preluate din catalogul SwitchMorn
            furnizat.
          </p>
          <a
            href={`/catalog/${product.source}`}
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            Vezi pagina din catalog
            <ArrowUpRight size={17} />
          </a>
        </div>
        <dl>
          {specs.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      {related.length > 0 && (
        <section className="related-coffees section-padding">
          <div className="section-top">
            <h2>Continuă descoperirea.</h2>
            <Link href="/cafea" className="text-link">
              Toate cafelele
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="shop-grid">
            {related.map((p) => (
              <CoffeeProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
