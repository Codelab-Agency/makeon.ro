import type { Metadata } from "next";
import MakeonLanding from "@/components/makeon-landing";

export const metadata: Metadata = {
  title: "Cafeaua ta — Cafea de origine pentru birou | Makeon",
  description: "Cafea proaspăt prăjită, espressoare în comodat și aprovizionare adaptată echipei tale. Descoperă serviciul de cafea pentru birou.",
};

export default function CoffeeServicePage() {
  return <MakeonLanding dedicatedCoffee />;
}
