import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Handles the two genuine electronic-signature ceremonies (in_person and
// self_serve). external_upload never hits this route — it's a direct client
// insert (see migration 024) since there's no ceremony to witness server-side.
// This route is the only place IP/user-agent/timestamp are captured, and the
// only place the final signed PDF is generated, so none of that can be
// spoofed from the browser.
export async function POST(request: Request) {
  const { waiverId, memberId, typedName, signatureDataUrl, captureMethod } = await request.json();

  if (
    !waiverId ||
    !memberId ||
    !typedName ||
    !signatureDataUrl ||
    !["in_person", "self_serve"].includes(captureMethod)
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: waiver } = await admin
    .from("waivers")
    .select("id, gym_id, title, storage_path")
    .eq("id", waiverId)
    .maybeSingle();
  if (!waiver) {
    return NextResponse.json({ error: "Waiver not found." }, { status: 404 });
  }

  const { data: member } = await admin
    .from("members")
    .select("id, gym_id, full_name, email")
    .eq("id", memberId)
    .maybeSingle();
  if (!member || member.gym_id !== waiver.gym_id) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  let witnessedByStaffId: string | null = null;
  let witnessLine: string | null = null;

  if (captureMethod === "self_serve") {
    if (user.id !== memberId) {
      return NextResponse.json({ error: "You can only sign your own waiver." }, { status: 403 });
    }
  } else {
    const { data: staff } = await admin
      .from("staff")
      .select("id, gym_id, role, full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (!staff || staff.gym_id !== waiver.gym_id || !["owner", "manager"].includes(staff.role)) {
      return NextResponse.json({ error: "Only owners and managers can facilitate an in-person signing." }, { status: 403 });
    }
    witnessedByStaffId = staff.id;
    witnessLine = `Witnessed by: ${staff.full_name} (${staff.role})`;
  }

  const { data: existing } = await admin
    .from("waiver_signatures")
    .select("id")
    .eq("waiver_id", waiverId)
    .eq("member_id", memberId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "This waiver has already been signed." }, { status: 409 });
  }

  const { data: templateFile, error: downloadError } = await admin.storage
    .from("waiver-templates")
    .download(waiver.storage_path);
  if (downloadError || !templateFile) {
    return NextResponse.json({ error: "Could not load the waiver document." }, { status: 500 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-nf-client-connection-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const signedAt = new Date();

  const pdfDoc = await PDFDocument.load(await templateFile.arrayBuffer());
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pngBytes = Buffer.from(signatureDataUrl.split(",")[1], "base64");
  const signatureImage = await pdfDoc.embedPng(pngBytes);
  const sigDims = signatureImage.scaleToFit(220, 70);

  const page = pdfDoc.addPage([612, 792]);
  let y = 740;
  const left = 56;

  function heading(text: string) {
    page.drawText(text, { x: left, y, size: 16, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    y -= 28;
  }
  function line(text: string, opts?: { bold?: boolean; size?: number }) {
    for (const wrapped of wrapText(text, opts?.size ?? 11, opts?.bold ? boldFont : font, 612 - left * 2)) {
      page.drawText(wrapped, { x: left, y, size: opts?.size ?? 11, font: opts?.bold ? boldFont : font, color: rgb(0.15, 0.15, 0.15) });
      y -= (opts?.size ?? 11) + 6;
    }
  }
  function spacer(n = 10) {
    y -= n;
  }

  heading("Signature & Audit Certificate");
  line(waiver.title, { bold: true, size: 13 });
  spacer();
  line(`Signer: ${member.full_name} (${member.email})`);
  line(`Typed signature: ${typedName}`);
  line(`Signed electronically on ${signedAt.toUTCString()}`);
  line(`IP address: ${ip}`);
  line(`User agent: ${userAgent}`);
  if (witnessLine) line(witnessLine);
  spacer();
  line("By signing above, the signer affirms they have read, understood, and agree to be bound by the", { size: 10 });
  line("terms of this document, and consented to execute it electronically.", { size: 10 });
  spacer(20);

  page.drawText("Signature:", { x: left, y, size: 11, font: boldFont, color: rgb(0.15, 0.15, 0.15) });
  y -= sigDims.height + 6;
  page.drawImage(signatureImage, { x: left, y, width: sigDims.width, height: sigDims.height });

  const mergedBytes = await pdfDoc.save();
  const mergedBuffer = Buffer.from(mergedBytes);
  const finalHash = createHash("sha256").update(mergedBuffer).digest("hex");
  const signatureId = randomUUID();
  const finalPath = `${waiver.gym_id}/${memberId}/${signatureId}.pdf`;

  const { error: uploadError } = await admin.storage
    .from("signed-waivers")
    .upload(finalPath, mergedBuffer, { contentType: "application/pdf" });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { error: insertError } = await admin.from("waiver_signatures").insert({
    id: signatureId,
    waiver_id: waiverId,
    gym_id: waiver.gym_id,
    member_id: memberId,
    capture_method: captureMethod,
    typed_name: typedName,
    esign_consent_at: signedAt.toISOString(),
    ip_address: ip,
    user_agent: userAgent,
    witnessed_by_staff_id: witnessedByStaffId,
    final_pdf_path: finalPath,
    final_pdf_hash: finalHash,
    signed_at: signedAt.toISOString(),
  });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, signatureId });
}

function wrapText(text: string, size: number, font: PDFFont, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}
