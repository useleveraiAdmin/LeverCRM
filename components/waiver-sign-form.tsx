"use client";

import { useRef, useState } from "react";
import { SignaturePad, type SignaturePadHandle } from "./signature-pad";

// Shared signing ceremony used both by staff (capture_method "in_person",
// facilitating with the client present) and by members signing themselves
// (capture_method "self_serve"). Both paths post to /api/waivers/sign, which
// captures the server-side audit trail (IP/user-agent/timestamp) and
// generates the final signed PDF — nothing legally load-bearing happens here
// in the browser beyond collecting the signer's input.
export function WaiverSignForm({
  waiverId,
  waiverTitle,
  pdfUrl,
  memberId,
  captureMethod,
  defaultName,
  onComplete,
  onCancel,
}: {
  waiverId: string;
  waiverTitle: string;
  pdfUrl: string;
  memberId: string;
  captureMethod: "in_person" | "self_serve";
  defaultName?: string;
  onComplete: () => void;
  onCancel?: () => void;
}) {
  const sigRef = useRef<SignaturePadHandle>(null);
  const [reviewed, setReviewed] = useState(false);
  const [consented, setConsented] = useState(false);
  const [typedName, setTypedName] = useState(defaultName ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = reviewed && consented && typedName.trim().length > 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const signatureDataUrl = sigRef.current?.getDataUrl();
    if (!signatureDataUrl) {
      setError("Please draw your signature.");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/waivers/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waiverId, memberId, typedName: typedName.trim(), signatureDataUrl, captureMethod }),
    });
    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Something went wrong.");
      return;
    }
    onComplete();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium">{waiverTitle}</p>
        <iframe
          src={pdfUrl}
          className="mt-2 h-96 w-full rounded border"
          style={{ borderColor: "var(--border)" }}
          title={waiverTitle}
        />
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} className="mt-0.5" />
        <span>I have read and reviewed this document in full.</span>
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)} className="mt-0.5" />
        <span>
          I consent to sign this document electronically and understand it has the same legal effect as a
          handwritten signature. I may request a paper copy at any time.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Type your full legal name</span>
        <input required value={typedName} onChange={(e) => setTypedName(e.target.value)} className="input" />
      </label>

      <div>
        <p className="text-xs font-medium text-muted">Draw your signature</p>
        <div className="mt-1">
          <SignaturePad ref={sigRef} />
        </div>
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={!canSubmit || loading} className="btn btn-primary">
          {loading ? "Signing…" : "Sign & agree"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
