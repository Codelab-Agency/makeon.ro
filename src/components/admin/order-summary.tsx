"use client";

import { useDocumentInfo } from "@payloadcms/ui";
import { MapPin, Package, UserRound, CreditCard } from "lucide-react";
import type { Order } from "@/payload-types";
import ProductionPayment from "./production-payment";

const paymentLabels = {
  requested: "De confirmat telefonic",
  pending: "În așteptarea plății",
  paid: "Plătită",
  expired: "Expirată",
  failed: "Eșuată",
};
const string = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

/** Read-only view of the payment snapshot; amounts are converted from bani for display only. */
export function OrderSummary() {
  const { data } = useDocumentInfo();
  const order = data as Order | undefined;
  if (!order?.reference) return null;
  const money = (amount: number) =>
    new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: order.currency || "RON",
    }).format(amount / 100);
  const shipping = order.shippingAddress;
  const recipient =
    shipping && typeof shipping === "object" && !Array.isArray(shipping)
      ? shipping
      : {};
  // Support Stripe's nested shipping details and older flat address snapshots.
  const nested = recipient.address;
  const address = (
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? nested
      : recipient
  ) as Record<string, unknown>;
  const addressLines = [
    string(recipient.name),
    string(address.line1),
    string(address.line2),
    [string(address.postal_code), string(address.city)]
      .filter(Boolean)
      .join(" "),
    [
      string(address.state),
      string(address.country) === "RO" ? "România" : string(address.country),
    ]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean);
  return (
    <div className="makeon-order">
      <section className="makeon-order-overview">
        <div>
          <span className="makeon-order-eyebrow">REZUMAT COMANDĂ</span>
          <h2>Comanda #{order.id}</h2>
          {order.orderType === "production" && (
            <strong>La cerere / producție</strong>
          )}
          <p>
            {new Intl.DateTimeFormat("ro-RO", {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: "Europe/Bucharest",
            }).format(new Date(order.createdAt))}
          </p>
        </div>
        <span
          className={`makeon-order-payment makeon-order-payment--${order.status}`}
        >
          <CreditCard size={16} />
          {paymentLabels[order.status]}
        </span>
        <div className="makeon-order-reference">
          Referință: {order.reference}
          {order.legalAcceptedAt && <p>Termeni acceptați: versiunea {order.legalVersion}, {new Intl.DateTimeFormat("ro-RO", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(new Date(order.legalAcceptedAt))}.</p>}
        </div>
      </section>
      {order.orderType === "production" && (
        <ProductionPayment
          key={`${order.id}-${order.status}-${order.paymentAttempt}`}
          order={order}
        />
      )}
      <div className="makeon-order-details">
        <section className="makeon-order-panel">
          <h3>
            <UserRound size={19} /> Client
          </h3>
          <strong>{order.customerName || "Numele nu este disponibil"}</strong>
          {order.customerEmail && (
            <a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a>
          )}
          {order.customerPhone && (
            <a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a>
          )}
        </section>
        <section className="makeon-order-panel">
          <h3>
            <MapPin size={19} /> Adresă de livrare
          </h3>
          <address>
            {addressLines.length
              ? addressLines.map((line, i) => <div key={i}>{line}</div>)
              : "Adresa nu este disponibilă încă."}
          </address>
        </section>
      </div>
      <section className="makeon-order-panel">
        <h3>
          <Package size={19} /> Produse comandate
        </h3>
        <div className="makeon-order-items">
          {order.items.map((item, i) => (
            <div className="makeon-order-item" key={item.id || i}>
              <span className="makeon-order-quantity">{item.quantity}×</span>
              <div>
                <strong>{item.name}</strong>
                <p>
                  {item.grind} ·{" "}
                  {item.unitPriceBani > 0
                    ? `${money(item.unitPriceBani)} / buc.`
                    : "Preț de confirmat"}
                </p>
              </div>
              <strong className="makeon-order-item-total">
                {item.unitPriceBani > 0
                  ? money(item.unitPriceBani * item.quantity)
                  : "La cerere"}
              </strong>
            </div>
          ))}
        </div>
        <dl className="makeon-order-totals">
          <div>
            <dt>Produse</dt>
            <dd>{money(order.totalBani - order.shippingBani)}</dd>
          </div>
          <div>
            <dt>Transport</dt>
            <dd>{money(order.shippingBani)}</dd>
          </div>
          <div className="makeon-order-grand-total">
            <dt>
              {order.status === "requested"
                ? "Total estimativ"
                : "Total comandă"}
            </dt>
            <dd>{money(order.totalBani)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
