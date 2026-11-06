"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Client-side because the root layout re-renders inside server actions, where reading cookies on the server fails.
export function DemoBanner() {
  const pathname = usePathname();
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getClaims()
      .then(({ data }) => setGuest(Boolean(data?.claims.is_anonymous)));
  }, [pathname]);

  if (!guest) return null;
  return (
    <p className="bg-primary px-4 py-2 text-center text-sm text-primary-foreground">
      You&apos;re exploring a demo closet. Your changes stay in this guest session, and it includes 10 AI requests.
    </p>
  );
}
