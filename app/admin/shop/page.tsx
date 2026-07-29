import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { CreateProductForm, ProductsTable, PendingOrdersList } from "./shop-client";

export default async function ShopPage() {
  const context = await getAdminContext();
  if (!context.tierFlags.gym_shop) redirect("/admin/billing");
  if (context.role === "front_desk") redirect("/admin/dashboard");

  const supabase = await createClient();
  const [{ data: products }, { data: orders }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price_cents, stock_count, active")
      .order("created_at", { ascending: false }),
    supabase
      .from("product_orders")
      .select("id, quantity, total_cents, products(name), members(full_name)")
      .eq("status", "pending_pickup")
      .order("created_at", { ascending: true }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Gym shop</h1>
      <p className="mt-1 text-muted">Manage products and pickups.</p>

      <div className="mt-8 rounded-xl border border-border bg-surface p-6">
        <CreateProductForm gymId={context.gymId} />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold">Products</h2>
        <ProductsTable products={products ?? []} />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold">Awaiting pickup</h2>
        <PendingOrdersList
          orders={
            (orders ?? []) as unknown as {
              id: string;
              quantity: number;
              total_cents: number;
              products: { name: string } | null;
              members: { full_name: string } | null;
            }[]
          }
        />
      </div>
    </div>
  );
}
