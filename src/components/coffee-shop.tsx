"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowUpRight,
  Search,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import {
  categories,
  categoryLabel,
  coffeeProducts,
  money,
  type CoffeeCategory,
  type CoffeeProduct,
} from "@/lib/coffee-catalog";
import CoffeePack from "./coffee-pack";
import CustomSelect from "./custom-select";
import { useCart } from "./cart-provider";

gsap.registerPlugin(ScrollTrigger);

export function CoffeeProductCard({ product }: { product: CoffeeProduct }) {
  const { add } = useCart();
  return (
    <article className="shop-product-card">
      <Link className="shop-product-art" href={`/cafea/${product.slug}`}>
        <span className="shop-collection">{product.collection}</span>
        <CoffeePack product={product} />
        <span className="shop-art-arrow">
          <ArrowUpRight size={18} />
        </span>
      </Link>
      <div className="shop-product-info">
        <div className="shop-product-meta">
          <span>{categoryLabel(product.category)}</span>
          <span>{product.grams === 1000 ? "1 kg" : `${product.grams} g`}</span>
        </div>
        <Link href={`/cafea/${product.slug}`}>
          <h3>{product.name}</h3>
        </Link>
        <p>{product.notes.join(" · ")}</p>
        <div className="shop-product-bottom">
          <span>
            {product.price == null ? "Preț la cerere" : money(product.price)}
          </span>
          {product.category === "macinata" ? (
            <Link href={`/cafea/${product.slug}`} className="shop-add">
              Alege măcinarea
              <ArrowUpRight size={16} />
            </Link>
          ) : (
            <button
              className="shop-add"
              onClick={() =>
                add(
                  product.slug,
                  product.category === "boabe" ? "Boabe" : "Instant",
                )
              }
              aria-label={`Adaugă ${product.name} în coș`}
            >
              Adaugă
              <ShoppingBag size={16} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function CoffeeShop({ full = false }: { full?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [category, setCategory] = useState<"all" | CoffeeCategory>("all"),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("featured"),
    [all, setAll] = useState(full);
  const filtered = useMemo(() => {
    const results = coffeeProducts.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        `${p.name} ${p.origin ?? ""} ${p.notes.join(" ")}`
          .toLocaleLowerCase("ro")
          .includes(search.toLocaleLowerCase("ro")),
    );
    return sort === "name"
      ? [...results].sort((a, b) => a.name.localeCompare(b.name, "ro"))
      : results;
  }, [category, search, sort]);
  const shown = all ? filtered : filtered.slice(0, 6);
  const shownKey = shown.map((product) => product.slug).join(",");
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.utils
          .toArray<HTMLElement>(".shop-product-card")
          .forEach((card, i) => {
            gsap.fromTo(
              card,
              { y: 35, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.65,
                delay: (i % 3) * 0.08,
                ease: "power3.out",
                scrollTrigger: { trigger: card, start: "top 95%", once: true },
              },
            );
          });
        ScrollTrigger.refresh();
      }, root);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, [shownKey]);
  return (
    <section
      ref={root}
      className={`coffee-shop section-padding ${full ? "shop-full" : ""}`}
      id="magazin"
    >
      <div className="section-top">
        <span className="eyebrow">SWITCHMORN COFFEE / MAGAZIN</span>
        <span className="section-index">ALEGE-ȚI RITUALUL</span>
      </div>
      <div className="shop-heading">
        <div>
          <h2>
            Cafeaua ta.
            <br />
            <span>Exact pe gustul tău.</span>
          </h2>
          <p>
            Blenduri pentru fiecare zi, cafele de origine și ritualuri de
            descoperit. Din catalogul SwitchMorn, pentru birou și pentru acasă.
          </p>
        </div>
        <div className="shop-heading-count">
          <span>{coffeeProducts.length}</span>
          <small>
            sortimente
            <br />
            de descoperit
          </small>
        </div>
      </div>
      <div className="shop-toolbar">
        <div
          className="shop-categories"
          role="group"
          aria-label="Filtrează cafeaua"
        >
          {categories.map((c) => (
            <button
              key={c.value}
              aria-pressed={category === c.value}
              onClick={() => {
                setCategory(c.value);
                setAll(full);
              }}
            >
              {c.label}
              <span>
                {c.value === "all"
                  ? coffeeProducts.length
                  : coffeeProducts.filter((p) => p.category === c.value).length}
              </span>
            </button>
          ))}
        </div>
        <div className="shop-search-row">
          <label className="shop-search">
            <Search size={17} />
            <span className="sr-only">Caută cafeaua</span>
            <input
              placeholder="Caută o origine, o aromă..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="shop-sort">
            <SlidersHorizontal size={15} />
            <CustomSelect
              label="Sortează cafelele"
              value={sort}
              onChange={setSort}
              options={[
                { value: "featured", label: "Selecția noastră" },
                { value: "name", label: "Nume A–Z" },
              ]}
            />
          </div>
        </div>
      </div>
      <div className="shop-result-count" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "sortiment" : "sortimente"}
        {search && ` pentru „${search}”`}
      </div>
      {shown.length ? (
        <div className="shop-grid">
          {shown.map((product) => (
            <CoffeeProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="shop-empty">
          <Search size={29} />
          <h3>Nicio cafea găsită.</h3>
          <p>Încearcă altă aromă sau explorează toate sortimentele.</p>
          <button
            className="text-link"
            onClick={() => {
              setCategory("all");
              setSearch("");
            }}
          >
            Resetează filtrele
            <ArrowUpRight size={17} />
          </button>
        </div>
      )}
      {!all && filtered.length > 6 && (
        <div className="shop-more">
          <button className="primary-button" onClick={() => setAll(true)}>
            Descoperă toate cele {filtered.length} cafele
            <ArrowUpRight size={18} />
          </button>
          <Link href="/cafea">
            Deschide magazinul
            <ArrowUpRight size={15} />
          </Link>
        </div>
      )}
      <div className="shop-service-line">
        <span>
          <CoffeeIcon />
          Boabe & măcinată
        </span>
        <span>Gramaje din catalog</span>
        <span>Prețuri și disponibilitate la cerere</span>
      </div>
    </section>
  );
}
function CoffeeIcon() {
  return <ShoppingBag size={15} />;
}
