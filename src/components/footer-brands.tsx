import Image from "next/image";
import Link from "next/link";

/** Shared brand links for the landing, shop and legal pages. */
export default function FooterBrands() {
  return (
    <div className="footer-brands">
      <Link href="/cafea">
        <Image src="/images/switchmorn-coffee-logo.webp" alt="SwitchMORN Coffee" width={80} height={81} className="footer-coffee-logo" />
      </Link>
      <Link href="/apa">
        <Image src="/images/vero-aqua-logo.webp" alt="Vero Aqua" width={110} height={42} className="footer-vero-logo" />
      </Link>
    </div>
  );
}
