import Image from "next/image";
import Link from "next/link";

export default function BrandLogo({ href = "/", priority = false }: { href?: string; priority?: boolean }) {
  return <Link className="wordmark brand-mark" href={href} aria-label="Makeon, acasă"><Image className="brand-symbol" src="/images/makeon-logo.svg" alt="" width={58} height={58} priority={priority}/><span className="brand-name">makeon<span className="logo-dot">®</span></span></Link>;
}
