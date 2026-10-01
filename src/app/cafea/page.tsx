import type { Metadata } from "next";
import CoffeeShop from "@/components/coffee-shop";
import ShopShell from "@/components/shop-shell";

export const metadata:Metadata={title:"Magazin cafea SwitchMorn — Makeon",description:"Descoperă 17 sortimente SwitchMorn: cafea boabe, măcinată, solubilă și selecții de origine. Alege-ți ritualul și pregătește selecția ta."};
export default function CoffeeStore(){return <ShopShell><div className="shop-banner section-padding"><span className="eyebrow">PENTRU BIROU. PENTRU ACASĂ. PENTRU TINE.</span><h1>Un ritual bun<br/><span>merită dus acasă.</span></h1><p>Cafeaua pe care o iubești, dincolo de pauza de la birou.</p><span className="shop-banner-star">✳</span></div><CoffeeShop full/></ShopShell>;}
