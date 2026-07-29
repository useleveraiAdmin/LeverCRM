"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AdminContext } from "@/lib/admin/context";

type NavItem = {
  href: string;
  label: string;
  show: boolean;
};

export function AdminNav({ context }: { context: AdminContext }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { role, tierFlags } = context;

  const items: NavItem[] = [
    { href: "/admin/dashboard", label: "Dashboard", show: true },
    { href: "/admin/classes", label: "Classes", show: true },
    { href: "/admin/checkins", label: "Check-in", show: true },
    { href: "/admin/staff", label: "Staff", show: role === "owner" },
    {
      href: "/admin/appointments",
      label: "Appointments",
      show: tierFlags.private_lessons && role !== "front_desk",
    },
    { href: "/admin/shop", label: "Shop", show: tierFlags.gym_shop && role !== "front_desk" },
    {
      href: "/admin/email-automations",
      label: "Email automations",
      show: tierFlags.email_automation && role === "owner",
    },
    { href: "/admin/branding", label: "Branding", show: role === "owner" },
    { href: "/admin/billing", label: "Billing", show: role === "owner" },
  ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
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
