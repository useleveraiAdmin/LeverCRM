"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  message: string;
  read_at: string | null;
  created_at: string;
  related_id: string | null;
};

export function NotificationsBell({ staffId }: { staffId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  async function loadUnreadCount() {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("staff_id", staffId)
      .is("read_at", null);
    setUnreadCount(count ?? 0);
  }

  useEffect(() => {
    loadUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      const { data } = await supabase
        .from("notifications")
        .select("id, message, read_at, created_at, related_id")
        .eq("staff_id", staffId)
        .order("created_at", { ascending: false })
        .limit(15);
      setNotifications(data ?? []);
    }
  }

  async function handleClickNotification(n: Notification) {
    if (!n.read_at) {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.related_id) {
      router.push(`/admin/messages/${n.related_id}`);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-full p-2 transition hover:opacity-70"
        aria-label="Notifications"
        onClick={toggle}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: "var(--muted)" }}>
          <path
            d="M12 2a6 6 0 0 0-6 6v3.6c0 .7-.3 1.4-.8 1.9L4 15v1h16v-1l-1.2-1.5c-.5-.5-.8-1.2-.8-1.9V8a6 6 0 0 0-6-6Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M9.5 19a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ background: "var(--danger)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 top-11 z-50 w-80 rounded-lg border shadow-lg"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="max-h-96 overflow-y-auto p-2">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className="flex w-full flex-col items-start gap-0.5 rounded-lg p-2 text-left text-sm transition hover:opacity-80"
                style={{ background: n.read_at ? "transparent" : "var(--surface-2)" }}
              >
                <span>{n.message}</span>
                <span className="text-xs text-muted">{new Date(n.created_at).toLocaleString()}</span>
              </button>
            ))}
            {notifications.length === 0 && <p className="p-3 text-sm text-muted">No notifications.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
