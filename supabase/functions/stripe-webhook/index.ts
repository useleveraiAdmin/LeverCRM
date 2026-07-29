import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";
import { BASE_TIER_FLAGS, PRICE_TIER_FLAGS } from "../_shared/price-tiers.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const GRACE_PERIOD_DAYS = 14;

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    return new Response(`Invalid signature: ${(err as Error).message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const gymId = session.client_reference_id;
      if (gymId && session.customer) {
        await supabase
          .from("gyms")
          .update({
            stripe_customer_id: String(session.customer),
            stripe_subscription_id: session.subscription ? String(session.subscription) : null,
          })
          .eq("id", gymId);
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = String(invoice.customer);
      const priceId = invoice.lines.data[0]?.price?.id;
      const tierFlags = priceId ? PRICE_TIER_FLAGS[priceId] : undefined;

      if (tierFlags) {
        await supabase
          .from("gyms")
          .update({
            tier_flags: tierFlags,
            subscription_status: "active",
            grace_period_ends_at: null,
            stripe_subscription_id: invoice.subscription ? String(invoice.subscription) : undefined,
          })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = String(invoice.customer);

      const { data: gym } = await supabase
        .from("gyms")
        .select("id, subscription_status, grace_period_ends_at")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (gym && gym.subscription_status !== "past_due") {
        const graceEnds = new Date();
        graceEnds.setDate(graceEnds.getDate() + GRACE_PERIOD_DAYS);
        await supabase
          .from("gyms")
          .update({ subscription_status: "past_due", grace_period_ends_at: graceEnds.toISOString() })
          .eq("id", gym.id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = String(subscription.customer);

      await supabase
        .from("gyms")
        .update({
          tier_flags: BASE_TIER_FLAGS,
          subscription_status: "canceled",
          grace_period_ends_at: null,
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    default:
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
