import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CoffeeDetail from "@/components/coffee-detail";
import ShopShell from "@/components/shop-shell";
import { coffeeProducts, productBySlug } from "@/lib/coffee-catalog";

export function generateStaticParams() {
  return coffeeProducts.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = productBySlug(slug);
  return {
    title: p
      ? `${p.name} ${p.grams} g — SwitchMorn Coffee / Makeon`
      : "Cafea — Makeon",
    description: p?.description,
  };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = productBySlug(slug);
  if (!p) notFound();
  return (
    <ShopShell>
      <CoffeeDetail product={p} />
    </ShopShell>
  );
}
