import Link from "next/link";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
});

export default function LandingPage() {
  return (
    <main
      className={`${playfair.variable} flex flex-1 flex-col items-center justify-center px-6 py-24 text-center`}
      style={{ background: "#F9F6F2", color: "#1A1A1A" }}
    >
      <span
        className="mb-6 rounded-full border px-4 py-1 text-xs font-medium uppercase tracking-wide"
        style={{ borderColor: "#E8E3DC", background: "#FFFFFF", color: "#64748B" }}
      >
        LeverCRM by Lever AI
      </span>
      <h1
        className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        The CRM built for gyms.
      </h1>
      <p className="mt-4 max-w-xl" style={{ color: "#64748B" }}>
        Classes, check-ins, members, and billing — one platform for your gym and
        one app your members actually use.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/signup"
          className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "#E63946" }}
        >
          Start your gym&apos;s free account
        </Link>
        <Link
          href="/login"
          className="rounded-lg border px-6 py-3 text-sm font-semibold transition hover:bg-white"
          style={{ borderColor: "#E8E3DC" }}
        >
          Staff sign in
        </Link>
      </div>
    </main>
  );
}
