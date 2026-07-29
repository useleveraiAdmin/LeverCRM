"use client";

import { Suspense, use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { completeMemberSignupIfNeeded } from "@/lib/auth/complete-signup";

export default function MemberLoginPage({
  params,
}: {
  params: Promise<{ gymSlug: string }>;
}) {
  const { gymSlug } = use(params);
  return (
    <Suspense fallback={null}>
      <MemberLoginForm gymSlug={gymSlug} />
    </Suspense>
  );
}

function MemberLoginForm({ gymSlug }: { gymSlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "not_member"
      ? "That account isn't registered as a member of this gym."
      : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    try {
      const gymId = await completeMemberSignupIfNeeded(supabase, data.user);
      if (gymId) {
        router.push(`/portal/${gymSlug}/calendar`);
        return;
      }
      const { data: member } = await supabase
        .from("members")
        .select("gym_id, gyms!inner(slug)")
        .eq("id", data.user.id)
        .maybeSingle();

      const memberGym = member?.gyms as { slug: string } | { slug: string }[] | undefined;
      const memberGymSlug = Array.isArray(memberGym) ? memberGym[0]?.slug : memberGym?.slug;

      if (member && memberGymSlug === gymSlug) {
        router.push(`/portal/${gymSlug}/calendar`);
      } else {
        setError("That account isn't registered as a member of this gym.");
        await supabase.auth.signOut();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong signing you in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-8"
      >
        <h1 className="text-xl font-semibold">Member sign in</h1>

        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted">Password</span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-gym-primary px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-4 text-center text-sm text-muted">
          New here?{" "}
          <Link href={`/portal/${gymSlug}/signup`} className="text-gym-primary">
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}
