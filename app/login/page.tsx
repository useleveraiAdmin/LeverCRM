"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { createClient } from "@/lib/supabase/client";
import { completeStaffSignupIfNeeded } from "@/lib/auth/complete-signup";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
});

export default function StaffLoginPage() {
  return (
    <Suspense fallback={null}>
      <StaffLoginForm />
    </Suspense>
  );
}

function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "not_staff"
      ? "That account isn't registered as gym staff."
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
      const gymId = await completeStaffSignupIfNeeded(supabase, data.user);
      if (gymId) {
        router.push("/admin/dashboard");
        return;
      }
      const { data: staff } = await supabase
        .from("staff")
        .select("gym_id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (staff) {
        router.push("/admin/dashboard");
      } else {
        setError("That account isn't registered as gym staff.");
        await supabase.auth.signOut();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong signing you in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className={`${playfair.variable} flex flex-1 items-center justify-center px-6 py-16`}
      style={{ background: "#F9F6F2", color: "#1A1A1A" }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border p-8 shadow-sm"
        style={{ borderColor: "#E8E3DC", background: "#FFFFFF" }}
      >
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Staff sign in
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#64748B" }}>
          For gym owners, managers, and front desk.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium" style={{ color: "#64748B" }}>
              Email
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "#E8E3DC" }}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium" style={{ color: "#64748B" }}>
              Password
            </span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "#E8E3DC" }}
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 text-sm" style={{ color: "#E63946" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "#E63946" }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-4 text-center text-sm" style={{ color: "#64748B" }}>
          New gym?{" "}
          <a
            href="https://levercrm-landing.netlify.app/signup.html"
            style={{ color: "#E63946", fontWeight: 600 }}
          >
            Create an account
          </a>
        </p>
      </form>
    </main>
  );
}
