"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ImageUpload } from "@/components/image-upload";

export function ProfileForm({
  gymId,
  memberId,
  initialFullName,
  initialPhone,
  initialDob,
  initialPictureUrl,
}: {
  gymId: string;
  memberId: string;
  initialFullName: string;
  initialPhone: string | null;
  initialDob: string | null;
  initialPictureUrl: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [dob, setDob] = useState(initialDob ?? "");
  const [pictureUrl, setPictureUrl] = useState(initialPictureUrl ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await supabase
      .from("members")
      .update({
        full_name: fullName,
        phone: phone || null,
        date_of_birth: dob || null,
        profile_picture_url: pictureUrl || null,
      })
      .eq("id", memberId);

    setLoading(false);
    setEditing(false);
    router.refresh();
  }

  function handleCancel() {
    setFullName(initialFullName);
    setPhone(initialPhone ?? "");
    setDob(initialDob ?? "");
    setPictureUrl(initialPictureUrl ?? "");
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-4">
        {pictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pictureUrl} alt="" className="h-20 w-20 rounded-full border object-cover" style={{ borderColor: "var(--border)" }} />
        ) : (
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-xs text-muted"
            style={{ background: "var(--surface-2)" }}
          >
            No photo
          </div>
        )}
        <Field label="Full name" value={fullName} />
        <Field label="Phone" value={phone || "—"} />
        <Field label="Date of birth" value={dob || "—"} />
        <button className="btn btn-outline w-fit" onClick={() => setEditing(true)}>
          Edit profile
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted">Profile picture</span>
        <ImageUpload gymId={gymId} folder={`members/${memberId}`} currentUrl={pictureUrl || null} onUploaded={setPictureUrl} shape="circle" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted">Full name</span>
        <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted">Phone</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted">Date of birth</span>
        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="input" />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Saving…" : "Save profile"}
        </button>
        <button type="button" className="btn btn-outline" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}
