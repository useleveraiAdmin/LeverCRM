import { getMemberContext } from "@/lib/member/context";
import { MemberNav } from "./member-nav";
import { MemberHeader } from "./member-header";

export default async function MemberAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ gymSlug: string }>;
}) {
  const { gymSlug } = await params;
  const context = await getMemberContext(gymSlug);

  return (
    <div
      className="member-shell flex flex-1 flex-col"
      style={
        {
          "--gym-primary": context.branding.primaryColor || undefined,
          "--gym-secondary": context.branding.secondaryColor || undefined,
          background: "var(--background)",
          color: "var(--foreground)",
        } as React.CSSProperties
      }
    >
      <MemberHeader gymName={context.gymName} />
      <div className="app-grid">
        <MemberNav context={context} />
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
