import { Coffee, Leaf } from "lucide-react";
import type { CSSProperties } from "react";
import type { CoffeeProduct } from "@/lib/coffee-catalog";

export default function CoffeePack({ product }: { product: CoffeeProduct }) {
  if (product.imageUrl)
    return (
      <div className="coffee-pack-art product-photo">
        <img
          src={product.imageUrl}
          alt={product.imageAlt || `${product.name}, ${product.grams} g`}
          loading="lazy"
        />
      </div>
    );
  const tin =
    product.category === "solubila" ||
    product.category === "alternative" ||
    product.slug === "kopi-luwak";
  const origin = product.category === "macinata";
  return (
    <div
      className={`coffee-pack-art ${tin ? "pack-tin" : ""} ${origin ? "pack-origin" : ""}`}
      style={{ "--pack-color": product.color } as CSSProperties}
      aria-label={`Reprezentare de prezentare a ambalajului ${product.name}, ${product.grams} g`}
      role="img"
    >
      <div className="pack-shadow" />
      <div className="shop-pack">
        <div className="pack-top" />
        <div className="pack-label">
          <span className="pack-category">{product.collection}</span>
          <div className="pack-decoration">
            <Leaf size={30} />
            <Coffee size={41} />
            <Leaf size={26} />
          </div>
          <span className="pack-brand">
            SwitchMORN<small>COFFEE</small>
          </span>
          <strong>{product.name}</strong>
          <div className="pack-rule" />
          <span className="pack-weight">
            {product.grams === 1000 ? "1 kg" : `${product.grams} g`}
          </span>
          <span className="pack-type">
            {product.category === "boabe"
              ? "WHOLE BEANS"
              : product.category === "macinata"
                ? "GROUND COFFEE"
                : "INSTANT RITUAL"}
          </span>
        </div>
        <div className="pack-bottom" />
      </div>
    </div>
  );
}
