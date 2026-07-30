import { AdminSearch } from "./admin-search";
import { NotificationsBell } from "./admin-notifications";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  front_desk: "Front Desk",
};

export function AdminTopbar({
  fullName,
  role,
  staffId,
}: {
  fullName: string;
  role: string;
  staffId: string;
}) {
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
      <AdminSearch />
      <div className="flex items-center gap-4">
        <NotificationsBell staffId={staffId} />
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
