import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_PRICE_IDS = new Set([
  "price_1TydNoFGKmShNS5vxS3poP29", // Pro
  "price_1TydNtFGKmShNS5vziKPjckX", // Premium
  "price_1TydNxFGKmShNS5vItUUrZ1O", // Premium Plus
]);

export async function POST(request: Request) {
  const { priceId } = await request.json();

  if (!ALLOWED_PRICE_IDS.has(priceId)) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("gym_id, role, gyms(stripe_customer_id)")
    .eq("id", user.id)
    .maybeSingle();

  if (!staff || staff.role !== "owner") {
    return NextResponse.json({ error: "Only the gym owner can change billing." }, { status: 403 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Billing isn't configured yet — STRIPE_SECRET_KEY is unset." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const existingCustomerId = (staff.gyms as unknown as { stripe_customer_id: string | null })
    ?.stripe_customer_id;

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: staff.gym_id,
    customer: existingCustomerId ?? undefined,
    success_url: `${origin}/admin/billing?checkout=success`,
    cancel_url: `${origin}/admin/billing?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
