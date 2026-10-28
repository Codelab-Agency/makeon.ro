"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { CartButton } from "./cart-provider";
import BrandLogo from "./brand-logo";
import useDialogMotion from "./use-dialog-motion";

const links = [
  { label: "Cafeaua ta", href: "/cafeaua-ta" },
  { label: "Pauza ta de hidratare", href: "/apa" },
  { label: "Prăjitoria ta", href: "/cafea" },
  { label: "Evenimentul tău", href: "/evenimente" },
];

export default function SiteHeader({
  onOffer,
  sectionBase = "/",
}: {
  onOffer?: () => void;
  sectionBase?: "/" | "/apa";
}) {
  const navigation = links;
  const [mobileMenu, setMobileMenu] = useState(false);
  const menu = useRef<HTMLDialogElement>(null);
  useDialogMotion(menu, mobileMenu, "menu");
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1001px)");
    const close = () => {
      if (desktop.matches) setMobileMenu(false);
    };
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);
  return (
    <header className="header">
      <BrandLogo priority />
      <nav className="desktop-nav" aria-label="Navigație principală">
        {navigation.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <CartButton />
        {onOffer ? (
          <button className="offer-button" onClick={onOffer}>
            Hai să vorbim
            <ArrowUpRight size={17} />
          </button>
        ) : (
          <Link className="offer-button" href={`${sectionBase}#abonamente`}>
            Hai să vorbim
            <ArrowUpRight size={17} />
          </Link>
        )}
        <button
          className="menu-button"
          aria-label={mobileMenu ? "Închide meniul" : "Deschide meniul"}
          aria-expanded={mobileMenu}
          aria-controls="mobile-navigation"
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          {mobileMenu ? <X /> : <Menu />}
        </button>
      </div>
      <dialog
        ref={menu}
        className="mobile-menu-dialog"
        aria-label="Meniul Makeon"
        onCancel={(event) => {
          event.preventDefault();
          setMobileMenu(false);
        }}
      >
        <div className="mobile-menu-top">
          <BrandLogo />
          <button
            className="mobile-menu-close"
            aria-label="Închide meniul"
            onClick={() => setMobileMenu(false)}
            autoFocus
          >
            <X size={24} />
          </button>
        </div>
        <div className="mobile-menu-orbit" aria-hidden="true" />
        <nav
          id="mobile-navigation"
          className="mobile-menu-nav"
          aria-label="Navigație mobilă"
        >
          {navigation.map((link, i) => (
            <Link
              className="mobile-menu-link"
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenu(false)}
            >
              <span className="mobile-menu-index" aria-hidden="true">
                0{i + 1}
              </span>
              <span>{link.label}</span>
              <ArrowUpRight size={25} />
            </Link>
          ))}
        </nav>
        <div className="mobile-menu-bottom">
          <p>
            Cafea bună. Apă pură.
            <br />
            <span>Un singur furnizor.</span>
          </p>
          <a href="tel:+40744524728">
            Hai să vorbim
            <ArrowUpRight size={16} />
            <span>+40 744 524 728</span>
          </a>
        </div>
      </dialog>
    </header>
  );
}
