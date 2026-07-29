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
        Sign in to your gym.
      </h1>
      <p className="mt-4 max-w-xl" style={{ color: "#64748B" }}>
        Staff and members sign in here to their gym&apos;s existing LeverCRM account.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "#E63946" }}
        >
          Staff sign in
        </Link>
      </div>
      <p className="mt-6 text-sm" style={{ color: "#64748B" }}>
        Members sign in at their gym&apos;s own portal link.
      </p>
      <p className="mt-10 text-sm" style={{ color: "#64748B" }}>
        New gym?{" "}
        <a href="https://levercrm-landing.netlify.app" style={{ color: "#E63946", fontWeight: 600 }}>
          Get started at our site
        </a>
      </p>
    </main>
  );
}
