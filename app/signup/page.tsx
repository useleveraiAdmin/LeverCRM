"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { completeStaffSignupIfNeeded } from "@/lib/auth/complete-signup";
import { slugify } from "@/lib/slugify";

export default function GymSignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [gymName, setGymName] = useState("");
  const [gymSlug, setGymSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const slugCheckId = useRef(0);

  useEffect(() => {
    if (!slugTouched) setGymSlug(slugify(gymName));
  }, [gymName, slugTouched]);

  useEffect(() => {
    if (!gymSlug) {
      setSlugAvailable(null);
      return;
    }
    const id = ++slugCheckId.current;
    const timeout = setTimeout(async () => {
      const { data } = await supabase.rpc("is_gym_slug_available", { p_slug: gymSlug });
      if (slugCheckId.current === id) setSlugAvailable(data ?? null);
    }, 400);
    return () => clearTimeout(timeout);
  }, [gymSlug, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (slugAvailable === false) {
      setError("That gym URL is already taken — try another.");
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role_intent: "gym_owner",
          gym_name: gymName,
          gym_slug: gymSlug,
          owner_name: ownerName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session && data.user) {
      try {
        await completeStaffSignupIfNeeded(supabase, data.user);
        router.push("/admin/dashboard");
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
          Confirm it, then sign in to finish setting up {gymName}.
        </p>
        <Link href="/login" className="mt-8 text-sm font-medium text-gym-primary">
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
        <h1 className="text-xl font-semibold">Start your gym&apos;s account</h1>
        <p className="mt-1 text-sm text-muted">Free to start, upgrade any time.</p>

        <div className="mt-6 flex flex-col gap-4">
          <Field label="Gym name">
            <input
              required
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              className="input"
              placeholder="Ironworks MMA"
            />
          </Field>

          <Field label="Gym URL">
            <div className="flex items-center gap-1 text-sm text-muted">
              <span className="whitespace-nowrap">levercrm.net/portal/</span>
              <input
                required
                value={gymSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setGymSlug(slugify(e.target.value));
                }}
                className="input"
              />
            </div>
            {gymSlug && slugAvailable === false && (
              <p className="mt-1 text-xs text-red-400">That URL is taken.</p>
            )}
            {gymSlug && slugAvailable === true && (
              <p className="mt-1 text-xs text-emerald-400">Available.</p>
            )}
          </Field>

          <Field label="Your name">
            <input
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="input"
              placeholder="Jane Smith"
            />
          </Field>

          <Field label="Email">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Password">
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </Field>
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
          Already have an account?{" "}
          <Link href="/login" className="text-gym-primary">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
