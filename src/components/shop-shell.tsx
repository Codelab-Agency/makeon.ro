import { ArrowUpRight } from "lucide-react";
import SiteHeader from "./site-header";
import FooterIdentity from "./footer-identity";
import LegalFooter from "./legal-footer";
import FooterBrands from "./footer-brands";

export default function ShopShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site world-coffee shop-site">
      <SiteHeader />
      <main>{children}</main>
      <footer className="shop-footer">
        <FooterIdentity />
        <FooterBrands />
        <a href="tel:+40744524728">
          +40 744 524 728
          <ArrowUpRight size={15} />
        </a>
        <LegalFooter />
      </footer>
    </div>
  );
}
