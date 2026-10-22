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
          src="/images/makeon-horizontal-logo-open-a.png"
          alt=""
          width={240}
          height={80}
          priority={priority}
        />
        {/* Separate layers align the lettering with the emblem and adapt its contrast. */}
        <Image
          className="brand-horizontal-contrast"
          src="/images/makeon-horizontal-logo-open-a.png"
          alt=""
          aria-hidden="true"
          width={240}
          height={80}
        />
      </span>
    </Link>
  );
}
