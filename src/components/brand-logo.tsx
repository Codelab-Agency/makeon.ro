import Image from "next/image";
import Link from "next/link";

export default function BrandLogo({
  href = "/",
  priority = false,
}: {
  href?: string;
  priority?: boolean;
}) {
  return (
    <Link
      className="wordmark brand-mark"
      href={href}
      aria-label="Makeon, acasă"
    >
      <span className="brand-horizontal">
        <Image
          className="brand-emblem"
          src="/images/makeon-logo.svg"
          alt=""
          width={240}
          height={80}
          priority={priority}
        />
        {/* Keep the existing wordmark while the vector emblem stays open at the base. */}
        <Image
          className="brand-horizontal-contrast"
          src="/images/makeon-horizontal-logo.svg"
          alt=""
          aria-hidden="true"
          width={240}
          height={80}
        />
      </span>
    </Link>
  );
}
