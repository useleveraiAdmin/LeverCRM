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
    { href: `${base}/calendar`, label: "Calendar", show: true, icon: CalendarIcon },
    { href: `${base}/checkins`, label: "Check-ins", show: true, icon: CheckIcon },
    {
      href: `${base}/appointments`,
      label: "Privates",
      show: context.tierFlags.private_lessons,
      icon: ClockIcon,
    },
    { href: `${base}/shop`, label: "Shop", show: context.tierFlags.gym_shop, icon: BagIcon },
    { href: `${base}/profile`, label: "Profile", show: true, icon: UserIcon },
  ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push(`${base}/login`);
  }

  return (
    <nav className="bnav">
      {items
        .filter((i) => i.show)
        .map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={active ? "active" : ""}>
              <Icon />
              {item.label}
            </Link>
          );
        })}
      <button onClick={handleSignOut} className="flex flex-col items-center gap-0.5">
        <SignOutIcon />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </nav>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5" />
    </svg>
  );
}
function SignOutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ color: "var(--muted)" }}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M15 16l4-4-4-4M19 12H9" />
    </svg>
  );
}
