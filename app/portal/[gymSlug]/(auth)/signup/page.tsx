"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { completeMemberSignupIfNeeded } from "@/lib/auth/complete-signup";

export default function MemberSignupPage({
  params,
}: {
  params: Promise<{ gymSlug: string }>;
}) {
  const { gymSlug } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role_intent: "member", gym_slug: gymSlug, full_name: fullName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session && data.user) {
      try {
        await completeMemberSignupIfNeeded(supabase, data.user);
        router.push(`/portal/${gymSlug}/calendar`);
        return;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong finishing setup.");
        setLoading(false);
        return;
      }
    }

    setCheckEmail(true);
    setLoading(false);
  }

  if (checkEmail) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="mt-3 max-w-sm text-muted">
          We sent a confirmation link to <span className="text-foreground">{email}</span>.
          Confirm it, then sign in.
        </p>
        <Link href={`/portal/${gymSlug}/login`} className="mt-8 text-sm font-medium text-gym-primary">
          Go to sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-8"
      >
        <h1 className="text-xl font-semibold">Join as a member</h1>

        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted">Full name</span>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
            />
          </label>
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
              minLength={8}
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
          {loading ? "Creating your account…" : "Create account"}
        </button>

        <p className="mt-4 text-center text-sm text-muted">
          Already a member?{" "}
          <Link href={`/portal/${gymSlug}/login`} className="text-gym-primary">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
