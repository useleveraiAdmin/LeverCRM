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
    { href: "/admin/programs", label: "Programs", show: true },
    { href: "/admin/checkins", label: "Check-in", show: true },
    { href: "/admin/clients", label: "Clients", show: true },
    { href: "/admin/announcements", label: "Announcements", show: true },
    { href: "/admin/notes", label: "Notes", show: role !== "front_desk" },
    { href: "/admin/insights", label: "Insights", show: role === "owner" || role === "manager" },
    { href: "/admin/messages", label: "Messages", show: true },
    { href: "/admin/marketing", label: "Marketing", show: role === "owner" },
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
    { href: "/admin/waivers", label: "Waivers", show: role === "owner" || role === "manager" },
    { href: "/admin/staff", label: "Staff", show: role === "owner" },
    { href: "/admin/branding", label: "Branding", show: role === "owner" },
    { href: "/admin/billing", label: "Billing", show: role === "owner" },
    { href: "/admin/settings", label: "Settings", show: role === "owner" },
  ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav
      className="flex w-60 shrink-0 flex-col overflow-y-auto"
      style={{ background: "var(--sidebar-bg)" }}
    >
      <div className="px-5 py-5">
        <p className="text-base font-semibold" style={{ color: "var(--sidebar-fg)" }}>
          {context.gymName}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--sidebar-muted)" }}>
          {context.fullName}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-0.5 px-3">
        {items
          .filter((i) => i.show)
          .map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium transition"
                style={
                  active
                    ? { background: "var(--gym-primary)", color: "#06202b" }
                    : { color: "var(--sidebar-fg)" }
                }
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "var(--sidebar-surface)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                {item.label}
              </Link>
            );
          })}
      </div>
      <button
        onClick={handleSignOut}
        className="mx-3 mb-4 rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:opacity-80"
        style={{ color: "var(--sidebar-muted)" }}
      >
        Sign out
      </button>
    </nav>
  );
}
