"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Level = { id: string; name: string };
type Member = { id: string; full_name: string };

export function ProfileEditForm({
  memberId,
  canManage,
  fullName,
  phone,
  dateOfBirth,
  levelId,
  parentMemberId,
  levels,
  otherMembers,
}: {
  memberId: string;
  canManage: boolean;
  fullName: string;
  phone: string | null;
  dateOfBirth: string | null;
  levelId: string | null;
  parentMemberId: string | null;
  levels: Level[];
  otherMembers: Member[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(fullName);
  const [phoneVal, setPhoneVal] = useState(phone ?? "");
  const [dob, setDob] = useState(dateOfBirth ?? "");
  const [level, setLevel] = useState(levelId ?? "");
  const [parent, setParent] = useState(parentMemberId ?? "");
  const [loading, setLoading] = useState(false);

  const levelName = levels.find((l) => l.id === levelId)?.name ?? "—";
  const parentName = otherMembers.find((m) => m.id === parentMemberId)?.full_name ?? "—";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase
      .from("members")
      .update({
        full_name: name,
        phone: phoneVal || null,
        date_of_birth: dob || null,
        level_id: level || null,
        parent_member_id: parent || null,
      })
      .eq("id", memberId);
    setLoading(false);
    setEditing(false);
    router.refresh();
  }

  function handleCancel() {
    setName(fullName);
    setPhoneVal(phone ?? "");
    setDob(dateOfBirth ?? "");
    setLevel(levelId ?? "");
    setParent(parentMemberId ?? "");
    setEditing(false);
  }

  if (!editing) {
    return (
      <div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Full name" value={fullName} />
          <Field label="Phone" value={phone ?? "—"} />
          <Field label="Date of birth" value={dateOfBirth ?? "—"} />
          <Field label="Level" value={levelName} />
          <Field label="Parent / guardian" value={parentName} className="sm:col-span-2" />
        </div>
        {canManage && (
          <button className="btn btn-outline mt-4" onClick={() => setEditing(true)}>
            Edit profile
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Full name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Phone</span>
        <input value={phoneVal} onChange={(e) => setPhoneVal(e.target.value)} className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Date of birth</span>
        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Level</span>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="input">
          <option value="">None</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-xs font-medium text-muted">Parent / guardian (family link)</span>
        <select value={parent} onChange={(e) => setParent(e.target.value)} className="input">
          <option value="">None</option>
          {otherMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Saving…" : "Save changes"}
        </button>
        <button type="button" className="btn btn-outline" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}

type Note = { id: string; body: string; pinned: boolean; created_at: string; author_staff_id: string };

export function NotesSection({
  gymId,
  memberId,
  notes,
  staffId,
}: {
  gymId: string;
  memberId: string;
  notes: Note[];
  staffId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    await supabase.from("notes").insert({
      gym_id: gymId,
      member_id: memberId,
      author_staff_id: staffId,
      body,
    });
    setBody("");
    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note about this client…"
          className="input"
        />
        <button type="submit" disabled={loading} className="btn btn-primary shrink-0">
          Add
        </button>
      </form>
      <div className="mt-4 flex flex-col gap-3">
        {notes.map((n) => (
          <div key={n.id} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }}>
            <p>{n.body}</p>
            <p className="mt-1 text-xs text-muted">
              {new Date(n.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
        ))}
        {notes.length === 0 && <p className="text-sm text-muted">No notes yet.</p>}
      </div>
    </div>
  );
}

type Doc = { id: string; type: string; title: string; signed_at: string | null; signature_data_url: string | null };

export function DocumentsSection({
  gymId,
  memberId,
  documents,
  canManage,
}: {
  gymId: string;
  memberId: string;
  documents: Doc[];
  canManage: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"waiver" | "intake" | "other">("waiver");
  const [title, setTitle] = useState("Liability waiver");
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  function pos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const point = "touches" in e ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawing.current = true;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = pos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function draw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas || !drawing.current) return;
    const ctx = canvas.getContext("2d")!;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineCap = "round";
    const { x, y } = pos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  function endDraw() {
    drawing.current = false;
  }
  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setLoading(true);
    const signatureDataUrl = canvas.toDataURL("image/png");
    await supabase.from("member_documents").insert({
      gym_id: gymId,
      member_id: memberId,
      type,
      title,
      signature_data_url: signatureDataUrl,
      signed_at: new Date().toISOString(),
    });
    setLoading(false);
    setOpen(false);
    clearCanvas();
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-col gap-2">
        {documents.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderColor: "var(--border)" }}>
            <div>
              <p className="text-sm font-medium">{d.title}</p>
              <p className="text-xs text-muted">
                {d.type} {d.signed_at ? `· signed ${new Date(d.signed_at).toLocaleDateString()}` : ""}
              </p>
            </div>
            {d.signature_data_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.signature_data_url} alt="signature" className="h-8 w-24 rounded border bg-white object-contain" style={{ borderColor: "var(--border)" }} />
            )}
          </div>
        ))}
        {documents.length === 0 && <p className="text-sm text-muted">No documents on file.</p>}
      </div>

      {canManage && !open && (
        <button className="btn btn-outline mt-3" onClick={() => setOpen(true)}>
          + Add document
        </button>
      )}

      {open && (
        <div className="mt-3 rounded-lg border p-4" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">Type</span>
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="input">
                <option value="waiver">Waiver</option>
                <option value="intake">Intake form</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
            </label>
          </div>
          <p className="mt-3 text-xs font-medium text-muted">Signature</p>
          <canvas
            ref={canvasRef}
            width={400}
            height={120}
            className="mt-1 w-full touch-none rounded border bg-white"
            style={{ borderColor: "var(--border)" }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          <div className="mt-2 flex gap-2">
            <button type="button" className="btn btn-outline" onClick={clearCanvas}>
              Clear
            </button>
            <button type="button" disabled={loading} className="btn btn-primary" onClick={handleSave}>
              {loading ? "Saving…" : "Save document"}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
