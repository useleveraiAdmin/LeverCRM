import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <span className="mb-6 rounded-full border border-border bg-surface px-4 py-1 text-xs font-medium uppercase tracking-wide text-muted">
        LeverCRM
      </span>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        The CRM built for gyms.
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Classes, check-ins, members, and billing — one platform for your gym and
        one app your members actually use.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/signup"
          className="rounded-lg bg-gym-primary px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
        >
          Start your gym&apos;s free account
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-border px-6 py-3 text-sm font-semibold transition hover:bg-surface"
        >
          Staff sign in
        </Link>
      </div>
    </main>
  );
}
