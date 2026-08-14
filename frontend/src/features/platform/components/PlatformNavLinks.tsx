"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const platformLinks = [
  { href: "/courses", label: "Courses" },
  { href: "/admin", label: "Admin" },
  { href: "/platform", label: "Platform" },
  { href: "/community", label: "Community" },
] as const;

export function PlatformNavLinks() {
  const pathname = usePathname();

  return (
    <ul className="flex items-center gap-4">
      {platformLinks.map((link) => {
        const isCurrent = pathname === link.href;

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={isCurrent ? "page" : undefined}
              className={
                isCurrent
                  ? "text-sm font-semibold text-coral focus-visible:outline-white"
                  : "text-sm font-medium text-white/70 hover:text-white focus-visible:outline-white"
              }
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
