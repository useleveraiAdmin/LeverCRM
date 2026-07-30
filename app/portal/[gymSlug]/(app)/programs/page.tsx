import { createClient } from "@/lib/supabase/server";
import { getMemberContext } from "@/lib/member/context";

export default async function MemberProgramsPage({
  params,
}: {
  params: Promise<{ gymSlug: string }>;
}) {
  const { gymSlug } = await params;
  const context = await getMemberContext(gymSlug);
  const supabase = await createClient();

  const { data } = await supabase
    .from("programs")
    .select("id, name, tagline, description, highlights")
    .order("sort_order");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Programs</h1>
      <p className="mt-1 text-muted">What {context.gymName} offers.</p>

      <div className="mt-6 flex flex-col gap-3">
        {(data ?? []).map((p) => (
          <div key={p.id} className="card">
            <p className="font-display text-lg">{p.name}</p>
            {p.tagline && <p className="text-sm text-muted">{p.tagline}</p>}
            {p.description && <p className="mt-2 text-sm">{p.description}</p>}
            {((p.highlights as string[]) ?? []).length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 text-sm text-muted">
                {((p.highlights as string[]) ?? []).map((h, i) => (
                  <li key={i}>• {h}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {(data ?? []).length === 0 && <p className="text-sm text-muted">No programs listed yet.</p>}
      </div>
    </div>
  );
}
