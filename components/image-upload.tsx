"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ImageUpload({
  gymId,
  folder,
  currentUrl,
  onUploaded,
  shape = "square",
}: {
  gymId: string;
  folder: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  shape?: "square" | "circle";
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Please choose a PNG or JPEG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    setError(null);
    setUploading(true);

    const ext = file.type === "image/png" ? "png" : "jpg";
    // A random filename never collides, so this is always a fresh insert —
    // upsert:true was left off deliberately: it makes storage-js send an
    // x-upsert header that hits a different Storage API code path and
    // fails the insert RLS policy even for a brand-new object (confirmed
    // by reproducing with/without the header via a raw fetch).
    const path = `${gymId}/${folder}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("gym-media").upload(path, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("gym-media").getPublicUrl(path);
    setPreview(data.publicUrl);
    onUploaded(data.publicUrl);
    setUploading(false);
  }

  return (
    <div className="flex items-center gap-3">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className={`h-14 w-14 object-cover ${shape === "circle" ? "rounded-full" : "rounded-lg"}`}
        />
      ) : (
        <div
          className={`flex h-14 w-14 items-center justify-center text-xs text-muted ${
            shape === "circle" ? "rounded-full" : "rounded-lg"
          }`}
          style={{ background: "var(--surface-2)" }}
        >
          None
        </div>
      )}
      <div className="flex flex-col gap-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          className="btn btn-outline w-fit"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Upload image"}
        </button>
        {error && <span className="text-xs" style={{ color: "var(--danger)" }}>{error}</span>}
        <span className="text-xs text-muted">PNG or JPEG, up to 5MB.</span>
      </div>
    </div>
  );
}
