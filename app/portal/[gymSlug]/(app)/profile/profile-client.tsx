"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ProfileForm({
  memberId,
  initialFullName,
  initialPhone,
  initialDob,
  initialPictureUrl,
}: {
  memberId: string;
  initialFullName: string;
  initialPhone: string | null;
  initialDob: string | null;
  initialPictureUrl: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [dob, setDob] = useState(initialDob ?? "");
  const [pictureUrl, setPictureUrl] = useState(initialPictureUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

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
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {pictureUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pictureUrl}
          alt=""
          className="h-20 w-20 rounded-full border border-border object-cover"
        />
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted">Profile picture URL</span>
        <input value={pictureUrl} onChange={(e) => setPictureUrl(e.target.value)} className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted">Full name</span>
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted">Phone</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted">Date of birth</span>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="input"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-fit rounded-lg bg-gym-primary px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save profile"}
      </button>
      {saved && <p className="text-sm text-emerald-400">Saved.</p>}
    </form>
  );
}
