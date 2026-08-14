import Link from "next/link";

/**
 * New-user landing page after first Google sign-up.
 * Replace with an onboarding flow when ready.
 */
export default function WelcomePage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 px-4 py-20">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
          Welcome to Elovate!
        </h1>
        <p className="mt-3 text-base text-text-secondary">
          Your account is ready. Start exploring courses and elevating your
          skills.
        </p>
      </header>
      <Link
        href="/courses"
        className="rounded-lg bg-coral px-6 py-3 text-sm font-semibold text-white hover:brightness-95"
      >
        Explore courses
      </Link>
    </main>
  );
}
