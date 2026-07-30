import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { CreateProgramForm, ProgramsList } from "./programs-client";

export default async function AdminProgramsPage() {
  const context = await getAdminContext();
  const canManage = context.role === "owner" || context.role === "manager";
  const supabase = await createClient();

  const { data } = await supabase.from("programs").select("id, name, tagline, description, highlights, level_tags").order("sort_order");
  const programs = (data ?? []).map((p) => ({
    ...p,
    highlights: (p.highlights as string[]) ?? [],
    level_tags: (p.level_tags as string[]) ?? [],
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Programs</h1>
      <p className="mt-1 text-muted">The classes and programs you offer, shown to members.</p>

      <div className="mt-6">
        <CreateProgramForm gymId={context.gymId} canManage={canManage} />
      </div>

      <ProgramsList programs={programs} canManage={canManage} />
    </div>
  );
}
