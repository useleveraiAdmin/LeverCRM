import { getMemberContext } from "@/lib/member/context";
import { MemberNav } from "./member-nav";

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
      className="flex flex-1"
      style={
        {
          "--gym-primary": context.branding.primaryColor || undefined,
          "--gym-secondary": context.branding.secondaryColor || undefined,
        } as React.CSSProperties
      }
    >
      <MemberNav context={context} />
      <div className="flex-1 overflow-y-auto p-8">{children}</div>
    </div>
  );
}
