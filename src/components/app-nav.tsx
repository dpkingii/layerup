"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link href="/" className="mr-auto font-semibold">
        Layerup
      </Link>
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          className={cn("hover:text-foreground", pathname === href ? "font-medium text-foreground" : "text-muted-foreground")}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
