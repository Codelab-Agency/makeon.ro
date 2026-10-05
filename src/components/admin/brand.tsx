export function AdminLogo() {
  return (
    <div className="makeon-admin-brand">
      <img src="/images/makeon-logo.svg" alt="" width="60" height="60" />
      <div>
        <span className="makeon-admin-wordmark">
          makeon<span className="makeon-admin-registered">®</span>
        </span>
        <span className="makeon-admin-caption">Administrarea magazinului</span>
      </div>
    </div>
  );
}

export function AdminIcon() {
  return (
    <div className="makeon-admin-brand makeon-admin-brand--compact">
      <img src="/images/makeon-logo.svg" alt="" width="34" height="34" />
      <span className="makeon-admin-wordmark">makeon</span>
    </div>
  );
}

export async function AdminWelcome({
  payload,
  user,
}: {
  payload: Payload;
  user?: TypedUser | null;
}) {
  if (!user || user.collection !== "users") return null;
  const [products, images, orders] = await Promise.all([
    payload.count({
      collection: "products",
      overrideAccess: false,
      req: { user },
    }),
    payload.count({
      collection: "media",
      overrideAccess: false,
      req: { user },
    }),
    payload.count({
      collection: "orders",
      overrideAccess: false,
      req: { user },
    }),
  ]);
  const metrics = [
    {
      title: "Produse în catalog",
      value: products.totalDocs,
      href: "/admin/collections/products",
      icon: Package,
      detail: "Sortimente, prețuri și stocuri",
    },
    {
      title: "Imagini de produs",
      value: images.totalDocs,
      href: "/admin/collections/media",
      icon: ImageIcon,
      detail: "Biblioteca vizuală a magazinului",
    },
    {
      title: "Comenzi",
      value: orders.totalDocs,
      href: "/admin/collections/orders",
      icon: ShoppingBag,
      detail: "Toate comenzile, într-un loc",
    },
  ];
  return (
    <div className="makeon-admin-overview">
      <section className="makeon-admin-welcome">
        <div className="makeon-admin-welcome-content">
          <h1>Panou de administrare</h1>
          <p>Gestionează produsele, stocurile și comenzile magazinului.</p>
          <div className="makeon-admin-shortcuts">
            <a
              className="makeon-admin-add"
              href="/admin/collections/products/create"
            >
              <Plus size={17} /> Adaugă produs
            </a>
            <a href="/cafea" target="_blank" rel="noreferrer">
              Deschide magazinul <ArrowUpRight size={17} />
            </a>
          </div>
        </div>
        <div className="makeon-admin-welcome-art" aria-hidden="true">
          <span />
          <span />
          <img src="/images/makeon-logo.svg" alt="" width="130" height="130" />
        </div>
      </section>
      <div className="makeon-admin-metrics">
        {metrics.map(({ icon: Icon, ...metric }) => (
          <a
            className="makeon-admin-metric"
            key={metric.href}
            href={metric.href}
          >
            <div className="makeon-admin-metric-top">
              <span>
                <Icon size={21} strokeWidth={1.6} />
              </span>
              <ArrowUpRight size={17} />
            </div>
            <strong>{metric.value}</strong>
            <h2>{metric.title}</h2>
            <p>{metric.detail}</p>
          </a>
        ))}
      </div>
      <div className="makeon-admin-section-title">
        <span>Administrare</span>
        <span>Acces rapid la magazinul tău</span>
      </div>
    </div>
  );
}
import {
  ArrowUpRight,
  ImageIcon,
  Package,
  Plus,
  ShoppingBag,
} from "lucide-react";
import type { Payload, TypedUser } from "payload";
