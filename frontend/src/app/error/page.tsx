import Link from "next/link";

/**
 * better-auth redirects here when OAuth fails (errorCallbackURL: "/error").
 * The `error` search param contains a short error code from the provider.
 */
export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 px-4 py-20">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
          Sign-in failed
        </h1>
        <p className="mt-3 text-base text-text-secondary">
          {error !== undefined
            ? `Error: ${error}`
            : "Something went wrong during sign in. Please try again."}
        </p>
      </header>
      <Link
        href="/login"
        className="rounded-lg bg-coral px-6 py-3 text-sm font-semibold text-white hover:brightness-95"
      >
        Back to sign in
      </Link>
    </main>
  );
}
