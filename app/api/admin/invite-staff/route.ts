import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { email, fullName, role } = await request.json();

  if (!email || !fullName || !["owner", "manager", "front_desk"].includes(role)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: caller } = await supabase
    .from("staff")
    .select("gym_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!caller || caller.role !== "owner") {
    return NextResponse.json({ error: "Only the gym owner can add staff." }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);
  if (inviteError || !invited.user) {
    return NextResponse.json(
      { error: inviteError?.message ?? "Could not invite that email." },
      { status: 400 }
    );
  }

  const { error: staffError } = await admin.from("staff").insert({
    id: invited.user.id,
    gym_id: caller.gym_id,
    role,
    full_name: fullName,
    email,
  });

  if (staffError) {
    return NextResponse.json({ error: staffError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
