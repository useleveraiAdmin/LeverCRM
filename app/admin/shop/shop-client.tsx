"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CreateProductForm({ gymId }: { gymId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const priceCents = Math.round(parseFloat(price) * 100);
    const { error: insertError } = await supabase.from("products").insert({
      gym_id: gymId,
      name,
      description: description || null,
      price_cents: priceCents,
      stock_count: stock,
      image_url: imageUrl || null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setName("");
    setDescription("");
    setPrice("");
    setStock(0);
    setImageUrl("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Product name</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Price (USD)</span>
          <input
            required
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Stock count</span>
          <input
            required
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Image URL (optional)</span>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="input" />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Description (optional)</span>
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-fit rounded-lg bg-gym-primary px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Adding…" : "Add product"}
      </button>
    </form>
  );
}

type Product = {
  id: string;
  name: string;
  price_cents: number;
  stock_count: number;
  active: boolean;
};

export function ProductsTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleActive(id: string, active: boolean) {
    setBusyId(id);
    await supabase.from("products").update({ active: !active }).eq("id", id);
    setBusyId(null);
    router.refresh();
  }

  async function updateStock(id: string, stock: number) {
    setBusyId(id);
    await supabase.from("products").update({ stock_count: stock }).eq("id", id);
    setBusyId(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Remove this product?")) return;
    setBusyId(id);
    await supabase.from("products").delete().eq("id", id);
    setBusyId(null);
    router.refresh();
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-muted">
          <th className="py-2 font-medium">Product</th>
          <th className="py-2 font-medium">Price</th>
          <th className="py-2 font-medium">Stock</th>
          <th className="py-2 font-medium">Active</th>
          <th className="py-2 font-medium"></th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id} className="border-b border-border/50">
            <td className="py-3">{p.name}</td>
            <td className="py-3">${(p.price_cents / 100).toFixed(2)}</td>
            <td className="py-3">
              <input
                type="number"
                min={0}
                defaultValue={p.stock_count}
                disabled={busyId === p.id}
                onBlur={(e) => updateStock(p.id, Number(e.target.value))}
                className="input w-20"
              />
            </td>
            <td className="py-3">
              <input
                type="checkbox"
                checked={p.active}
                disabled={busyId === p.id}
                onChange={() => toggleActive(p.id, p.active)}
              />
            </td>
            <td className="py-3 text-right">
              <button
                onClick={() => remove(p.id)}
                disabled={busyId === p.id}
                className="text-xs font-medium text-red-400 hover:underline"
              >
                Remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type Order = {
  id: string;
  quantity: number;
  total_cents: number;
  products: { name: string } | null;
  members: { full_name: string } | null;
};

export function PendingOrdersList({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function markPickedUp(id: string) {
    setBusyId(id);
    await supabase.from("product_orders").update({ status: "picked_up" }).eq("id", id);
    setBusyId(null);
    router.refresh();
  }

  if (orders.length === 0) return <p className="text-sm text-muted">No orders awaiting pickup.</p>;

  return (
    <div className="flex flex-col gap-2">
      {orders.map((o) => (
        <div
          key={o.id}
          className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
        >
          <div>
            <p className="font-medium">
              {o.members?.full_name ?? "Unknown member"} · {o.products?.name ?? "Unknown product"} ×{" "}
              {o.quantity}
            </p>
            <p className="text-sm text-muted">${(o.total_cents / 100).toFixed(2)}</p>
          </div>
          <button
            onClick={() => markPickedUp(o.id)}
            disabled={busyId === o.id}
            className="rounded-lg bg-gym-primary px-3 py-1.5 text-xs font-semibold text-black transition hover:opacity-90"
          >
            Mark picked up
          </button>
        </div>
      ))}
    </div>
  );
}
