"use client";

import { useRouter } from "next/navigation";
import { WaiverSignForm } from "@/components/waiver-sign-form";

// Blocks the rest of the member portal until a waiver is on file. No cancel
// option — signing is the only way through the gate.
export function WaiverGate({
  waiverId,
  waiverTitle,
  pdfUrl,
  memberId,
}: {
  waiverId: string;
  waiverTitle: string;
  pdfUrl: string;
  memberId: string;
}) {
  const router = useRouter();

  return (
    <div>
      <h1 className="text-xl font-semibold">Before you get started</h1>
      <p className="mt-1 text-muted">Please review and sign this waiver to continue.</p>
      <div className="card mt-4">
        <WaiverSignForm
          waiverId={waiverId}
          waiverTitle={waiverTitle}
          pdfUrl={pdfUrl}
          memberId={memberId}
          captureMethod="self_serve"
          onComplete={() => router.refresh()}
        />
      </div>
    </div>
  );
}
