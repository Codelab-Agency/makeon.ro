import type { Metadata } from "next";
import MakeonLanding from "@/components/makeon-landing";

export const metadata: Metadata = {
  title: "Vero Aqua — Apă filtrată și abonamente | Makeon",
  description: "Descoperă Vero Aqua: aparate de apă, filtre, instalare și mentenanță pentru biroul tău. Solicită o ofertă pentru soluția de apă potrivită echipei.",
};

export default function WaterPage() {
  return <MakeonLanding key="water" initialWorld="water" dedicatedWater />;
}
