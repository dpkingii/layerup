"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/settings/style", label: "Style" },
  { href: "/settings/comfort", label: "Comfort" },
  { href: "/settings/style-icons", label: "Style icons" },
  { href: "/settings/account", label: "Account" },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Settings"
      className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:sticky md:top-22 md:mx-0 md:w-40 md:shrink-0 md:self-start md:overflow-visible md:px-0"
    >
      <ul className="flex gap-5 text-sm font-semibold md:flex-col md:gap-1">
        {SECTIONS.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={cn(
                "inline-block border-b-2 py-1.5 whitespace-nowrap transition-colors",
                pathname === href
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
