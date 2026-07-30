import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { email, fullName, phone, dateOfBirth } = await request.json();

  if (!email || !fullName) {
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

  if (!caller || !["owner", "manager"].includes(caller.role)) {
    return NextResponse.json({ error: "Only owners and managers can add clients." }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);
  if (inviteError || !invited.user) {
    return NextResponse.json(
      { error: inviteError?.message ?? "Could not invite that email." },
      { status: 400 }
    );
  }

  const { error: memberError } = await admin.from("members").insert({
    id: invited.user.id,
    gym_id: caller.gym_id,
    full_name: fullName,
    email,
    phone: phone || null,
    date_of_birth: dateOfBirth || null,
  });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, memberId: invited.user.id });
}
