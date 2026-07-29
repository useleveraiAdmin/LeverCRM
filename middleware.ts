import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ADMIN_PATHS = ["/login", "/signup"];

function isMemberAuthPath(pathname: string) {
  return /^\/portal\/[^/]+\/(login|signup)$/.test(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user, supabase } = await updateSession(request);

  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const { data: staff } = await supabase
      .from("staff")
      .select("gym_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!staff) {
      return NextResponse.redirect(new URL("/login?error=not_staff", request.url));
    }
    return response;
  }

  if (PUBLIC_ADMIN_PATHS.includes(pathname) && user) {
    const { data: staff } = await supabase
      .from("staff")
      .select("gym_id")
      .eq("id", user.id)
      .maybeSingle();
    if (staff) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  if (pathname.startsWith("/portal/")) {
    const segments = pathname.split("/").filter(Boolean);
    const gymSlug = segments[1];

    if (isMemberAuthPath(pathname)) {
      return response;
    }

    if (!user) {
      return NextResponse.redirect(new URL(`/portal/${gymSlug}/login`, request.url));
    }

    const { data: member } = await supabase
      .from("members")
      .select("gym_id, gyms!inner(slug)")
      .eq("id", user.id)
      .maybeSingle();

    const memberGym = member?.gyms as { slug: string } | { slug: string }[] | undefined;
    const memberGymSlug = Array.isArray(memberGym) ? memberGym[0]?.slug : memberGym?.slug;

    if (!member || memberGymSlug !== gymSlug) {
      return NextResponse.redirect(
        new URL(`/portal/${gymSlug}/login?error=not_member`, request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
