"use client";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  front_desk: "Front Desk",
};

export function AdminTopbar({ fullName, role }: { fullName: string; role: string }) {
  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header
      className="flex h-15 shrink-0 items-center justify-between border-b px-6"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <input
        placeholder="Search clients…"
        className="input max-w-xs"
        // Global search is wired up in a later phase; the field is present
        // now so the shell layout doesn't shift when it goes live.
        disabled
      />
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative rounded-full p-2 transition hover:opacity-70"
          aria-label="Notifications"
        >
          <BellIcon />
        </button>
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
            style={{ background: "var(--gym-primary)", color: "#06202b" }}
          >
            {initials}
          </div>
          <span className="badge badge-neutral">{ROLE_LABEL[role] ?? role}</span>
        </div>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: "var(--muted)" }}>
      <path
        d="M12 2a6 6 0 0 0-6 6v3.6c0 .7-.3 1.4-.8 1.9L4 15v1h16v-1l-1.2-1.5c-.5-.5-.8-1.2-.8-1.9V8a6 6 0 0 0-6-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9.5 19a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
