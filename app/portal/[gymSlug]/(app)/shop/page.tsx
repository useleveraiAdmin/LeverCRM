import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMemberContext } from "@/lib/member/context";
import { PurchaseButton } from "./shop-client";

export default async function MemberShopPage({
  params,
}: {
  params: Promise<{ gymSlug: string }>;
}) {
  const { gymSlug } = await params;
  const context = await getMemberContext(gymSlug);
  if (!context.tierFlags.gym_shop) redirect(`/portal/${gymSlug}/calendar`);

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, price_cents, stock_count, image_url")
    .eq("active", true)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Shop</h1>
      <p className="mt-1 text-muted">Pick up in person at {context.gymName}.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(products ?? []).map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-surface p-4">
            {p.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image_url} alt={p.name} className="mb-3 h-32 w-full rounded-lg object-cover" />
            )}
            <p className="font-medium">{p.name}</p>
            {p.description && <p className="mt-1 text-sm text-muted">{p.description}</p>}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-semibold">${(p.price_cents / 100).toFixed(2)}</span>
              {p.stock_count > 0 ? (
                <PurchaseButton
                  productId={p.id}
                  gymId={context.gymId}
                  memberId={context.memberId}
                  priceCents={p.price_cents}
                />
              ) : (
                <span className="text-sm text-muted">Out of stock</span>
              )}
            </div>
          </div>
        ))}
        {(products ?? []).length === 0 && <p className="text-sm text-muted">No products yet.</p>}
      </div>
    </div>
  );
}
