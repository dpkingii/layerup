"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PAGE_FRAME } from "@/components/page-frame";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <nav className={cn(PAGE_FRAME, "flex h-14 items-center gap-6 text-sm")}>
        <Link href="/" className="mr-auto font-semibold tracking-tight">
          Layerup
        </Link>
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            className={cn(
              "transition-colors hover:text-foreground",
              pathname === href ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
