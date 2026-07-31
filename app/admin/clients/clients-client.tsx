"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WaiverSignForm } from "@/components/waiver-sign-form";

type WaiverMode = "sign_later" | "external_upload" | "in_person";
type ActiveWaiver = { id: string; title: string; storagePath: string };

async function sha256Hex(buffer: ArrayBuffer) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function AddClientForm({
  canManage,
  gymId,
  staffId,
  activeWaiver,
}: {
  canManage: boolean;
  gymId: string;
  staffId: string;
  activeWaiver: ActiveWaiver | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [waiverMode, setWaiverMode] = useState<WaiverMode>("sign_later");
  const [signedDate, setSignedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attested, setAttested] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set once the member record exists and we're walking them through
  // signing on this device — swaps the form for the shared signing UI.
  const [inPersonSigning, setInPersonSigning] = useState<{ memberId: string; pdfUrl: string } | null>(null);

  if (!canManage) return null;

  function resetAndClose() {
    setFullName("");
    setEmail("");
    setPhone("");
    setDateOfBirth("");
    setWaiverMode("sign_later");
    setAttested(false);
    setSignedDate(new Date().toISOString().slice(0, 10));
    if (uploadRef.current) uploadRef.current.value = "";
    setInPersonSigning(null);
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (waiverMode === "external_upload") {
      if (!uploadRef.current?.files?.[0]) {
        setError("Choose the signed waiver PDF to upload.");
        return;
      }
      if (!attested) {
        setError("Confirm this is a valid signed waiver before continuing.");
        return;
      }
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/add-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, phone: phone || null, dateOfBirth: dateOfBirth || null }),
    });
    const body = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(body.error ?? "Something went wrong.");
      return;
    }

    const memberId: string = body.memberId;

    if (waiverMode === "external_upload") {
      const file = uploadRef.current!.files![0];
      const bytes = await file.arrayBuffer();
      const fileHash = await sha256Hex(bytes);
      const signatureId = crypto.randomUUID();
      const path = `${gymId}/${memberId}/${signatureId}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("signed-waivers")
        .upload(path, file, { contentType: "application/pdf" });
      if (uploadError) {
        setLoading(false);
        setError(`Client was created, but the waiver upload failed: ${uploadError.message}`);
        return;
      }

      const { error: insertError } = await supabase.from("waiver_signatures").insert({
        id: signatureId,
        waiver_id: activeWaiver?.id ?? null,
        gym_id: gymId,
        member_id: memberId,
        capture_method: "external_upload",
        witnessed_by_staff_id: staffId,
        attestation_confirmed: true,
        final_pdf_path: path,
        final_pdf_hash: fileHash,
        signed_at: new Date(signedDate).toISOString(),
      });
      setLoading(false);
      if (insertError) {
        setError(`Client was created, but saving the waiver record failed: ${insertError.message}`);
        return;
      }
      router.refresh();
      resetAndClose();
      return;
    }

    if (waiverMode === "in_person" && activeWaiver) {
      const { data } = await supabase.storage.from("waiver-templates").createSignedUrl(activeWaiver.storagePath, 3600);
      setLoading(false);
      if (!data?.signedUrl) {
        setError("Client was created, but the waiver PDF couldn't be loaded. They can sign it later from their profile.");
        router.refresh();
        return;
      }
      setInPersonSigning({ memberId, pdfUrl: data.signedUrl });
      return;
    }

    setLoading(false);
    router.refresh();
    resetAndClose();
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Add client
      </button>
    );
  }

  if (inPersonSigning) {
    return (
      <div className="card flex flex-col gap-3">
        <p className="text-sm font-medium">Sign now — hand the device to the client</p>
        <WaiverSignForm
          waiverId={activeWaiver!.id}
          waiverTitle={activeWaiver!.title}
          pdfUrl={inPersonSigning.pdfUrl}
          memberId={inPersonSigning.memberId}
          captureMethod="in_person"
          defaultName={fullName}
          onComplete={() => {
            router.refresh();
            resetAndClose();
          }}
          onCancel={() => {
            router.refresh();
            resetAndClose();
          }}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Full name</span>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Email</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Phone (optional)</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Date of birth (optional)</span>
          <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="input" />
        </label>
      </div>
      <p className="text-xs text-muted">
        Sends an email invite so the client can set a password and sign in to the member portal.
      </p>

      <div>
        <p className="text-xs font-medium text-muted">Waiver</p>
        <div className="mt-1.5 flex flex-col gap-2">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="waiverMode"
              checked={waiverMode === "external_upload"}
              onChange={() => setWaiverMode("external_upload")}
              className="mt-0.5"
            />
            <span>Upload a waiver they already signed (paper or elsewhere)</span>
          </label>
          <label className="flex items-start gap-2 text-sm" style={{ opacity: activeWaiver ? 1 : 0.5 }}>
            <input
              type="radio"
              name="waiverMode"
              checked={waiverMode === "in_person"}
              onChange={() => setWaiverMode("in_person")}
              disabled={!activeWaiver}
              className="mt-0.5"
            />
            <span>
              Have them sign now, on this device
              {!activeWaiver && " — upload a waiver template under Settings first"}
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="waiverMode"
              checked={waiverMode === "sign_later"}
              onChange={() => setWaiverMode("sign_later")}
              className="mt-0.5"
            />
            <span>They&apos;ll sign in the app on first login</span>
          </label>
        </div>

        {waiverMode === "external_upload" && (
          <div className="mt-3 flex flex-col gap-2 rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">Signed waiver (PDF)</span>
              <input ref={uploadRef} type="file" accept="application/pdf" className="input" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">Date it was signed</span>
              <input type="date" value={signedDate} onChange={(e) => setSignedDate(e.target.value)} className="input" />
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} className="mt-0.5" />
              <span>I confirm this is a valid signed waiver executed by this client.</span>
            </label>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Adding…" : waiverMode === "in_person" ? "Create & sign" : "Send invite"}
        </button>
        <button type="button" className="btn btn-outline" onClick={resetAndClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}

type ClientRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  level_name: string | null;
};

export function ExportCsvButton({ clients }: { clients: ClientRow[] }) {
  function handleExport() {
    const header = ["Name", "Email", "Phone", "Date of birth", "Level"];
    const rows = clients.map((c) => [
      c.full_name,
      c.email,
      c.phone ?? "",
      c.date_of_birth ?? "",
      c.level_name ?? "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clients.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button className="btn btn-outline" onClick={handleExport}>
      Export CSV
    </button>
  );
}
