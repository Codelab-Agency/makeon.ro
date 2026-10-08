import { Coffee, Leaf, Package } from "lucide-react";
import { isGroundCoffee, isWholeBean, packageLabel } from "@/lib/product-format";
import type { CSSProperties } from "react";
import type { CoffeeProduct } from "@/lib/coffee-catalog";

export default function CoffeePack({ product }: { product: CoffeeProduct }) {
  if (product.imageUrl)
    return (
      <div className="coffee-pack-art product-photo">
        <img
          src={product.imageUrl}
          alt={product.imageAlt || `${product.name}, ${packageLabel(product)}`}
          loading="lazy"
        />
      </div>
    );
  if (product.category === "complementare") return <div className="coffee-pack-art complementary-placeholder" role="img" aria-label={`Produs complementar: ${product.name}`}><Package size={72} strokeWidth={1}/><strong>{product.name}</strong><span>{packageLabel(product)}</span></div>;
  const tin =
    product.category === "solubila" ||
    product.category === "alternative" ||
    product.slug === "kopi-luwak";
  const origin = isGroundCoffee(product);
  return (
    <div
      className={`coffee-pack-art ${tin ? "pack-tin" : ""} ${origin ? "pack-origin" : ""}`}
      style={{ "--pack-color": product.color } as CSSProperties}
      aria-label={`Reprezentare de prezentare a ambalajului ${product.name}, ${packageLabel(product)}`}
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
            {packageLabel(product)}
          </span>
          <span className="pack-type">
            {isWholeBean(product)
              ? "WHOLE BEANS"
              : isGroundCoffee(product)
                ? "GROUND COFFEE"
                : "INSTANT RITUAL"}
          </span>
        </div>
        <div className="pack-bottom" />
      </div>
    </div>
  );
}
