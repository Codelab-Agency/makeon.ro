import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CoffeeDetail from "@/components/coffee-detail";
import ShopShell from "@/components/shop-shell";
import { getProduct } from "@/lib/storefront";

export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
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
  const p = await getProduct(slug);
  if (!p) notFound();
  return (
    <ShopShell>
      <CoffeeDetail product={p} />
    </ShopShell>
  );
}
