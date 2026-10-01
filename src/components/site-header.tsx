"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { CartButton } from "./cart-provider";
import BrandLogo from "./brand-logo";

const links = [
  { label: "Universul Makeon", href: "/#ecosistem" },
  { label: "Magazin cafea", href: "/cafea" },
  { label: "Soluții", href: "/#solutii" },
  { label: "Servicii", href: "/#servicii" },
  { label: "Pentru companii", href: "/#abonamente" },
];

export default function SiteHeader({ onOffer }: { onOffer?: () => void }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  return <header className="header">
    <BrandLogo priority />
    <nav className="desktop-nav" aria-label="Navigație principală">{links.map(link=><Link key={link.href} href={link.href}>{link.label}{link.label==="Soluții"&&<span className="nav-plus">+</span>}</Link>)}</nav>
    <div className="header-actions"><CartButton/>{onOffer?<button className="offer-button" onClick={onOffer}>Hai să vorbim<ArrowUpRight size={17}/></button>:<Link className="offer-button" href="/#abonamente">Hai să vorbim<ArrowUpRight size={17}/></Link>}<button className="menu-button" aria-label={mobileMenu?"Închide meniul":"Deschide meniul"} aria-expanded={mobileMenu} aria-controls="mobile-navigation" onClick={()=>setMobileMenu(!mobileMenu)}>{mobileMenu?<X/>:<Menu/>}</button></div>
    {mobileMenu&&<nav id="mobile-navigation" className="mobile-nav" aria-label="Navigație mobilă">{links.map(link=><Link key={link.href} href={link.href} onClick={()=>setMobileMenu(false)}>{link.label}<ArrowUpRight size={18}/></Link>)}</nav>}
  </header>;
}
