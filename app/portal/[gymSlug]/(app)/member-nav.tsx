"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MemberContext } from "@/lib/member/context";

export function MemberNav({ context }: { context: MemberContext }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const base = `/portal/${context.gymSlug}`;

  const items = [
    { href: `${base}/calendar`, label: "Calendar", show: true },
    { href: `${base}/checkins`, label: "Check-ins", show: true },
    { href: `${base}/appointments`, label: "Appointments", show: context.tierFlags.private_lessons },
    { href: `${base}/shop`, label: "Shop", show: context.tierFlags.gym_shop },
    { href: `${base}/profile`, label: "Profile", show: true },
  ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push(`${base}/login`);
  }

  return (
    <nav className="flex w-56 shrink-0 flex-col border-r border-border bg-surface p-4">
      <div className="mb-6 px-2">
        <p className="text-xs uppercase tracking-wide text-muted">{context.gymName}</p>
        <p className="text-xs text-muted">{context.fullName}</p>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        {items
          .filter((i) => i.show)
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname.startsWith(item.href)
                  ? "bg-gym-primary text-black"
                  : "text-foreground hover:bg-surface-2"
              }`}
            >
              {item.label}
            </Link>
          ))}
      </div>
      <button
        onClick={handleSignOut}
        className="mt-4 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted transition hover:bg-surface-2"
      >
        Sign out
      </button>
    </nav>
  );
}
