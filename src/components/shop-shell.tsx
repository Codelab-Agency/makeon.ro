import Link from "next/link";
import { ArrowUpRight, Coffee, Droplets } from "lucide-react";
import SiteHeader from "./site-header";
import BrandLogo from "./brand-logo";

export default function ShopShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site world-coffee shop-site">
      <div className="announcement">
        <span>SwitchMorn Coffee. Din birou, până acasă.</span>
        <Link href="/#abonamente">
          Soluții pentru companii
          <ArrowUpRight size={12} />
        </Link>
      </div>
      <SiteHeader />
      <main>{children}</main>
      <footer className="shop-footer">
        <BrandLogo />
        <span>
          <Coffee size={15} />
          SwitchMorn Coffee
          <span className="shop-footer-dot" />
          <Droplets size={15} />
          Vero Aqua
        </span>
        <a href="tel:+40744524728">
          +40 744 524 728
          <ArrowUpRight size={15} />
        </a>
      </footer>
    </div>
  );
}
