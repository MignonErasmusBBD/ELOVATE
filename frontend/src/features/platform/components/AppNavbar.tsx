import Link from "next/link";
import type { CurrentUser } from "@/lib/session";
import { PlatformNavLinks } from "./PlatformNavLinks";

type AppNavbarProps = {
  currentUser: CurrentUser;
};

export function AppNavbar({ currentUser }: AppNavbarProps) {
  return (
    <header className="bg-ink text-white">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-3.5 md:px-10">
        <Link
          href="/courses"
          className="truncate text-sm font-bold tracking-wide focus-visible:outline-white md:text-base"
        >
          ELOVATE Learning Platform
        </Link>
        <PlatformNavLinks />

        <section
          aria-label="Account"
          className="ml-auto flex min-w-0 items-center gap-3 sm:gap-4"
        >
          <p className="min-w-0 text-right">
            <span className="block truncate text-sm font-medium">
              {currentUser.emailAddress}
            </span>
            <span className="mt-0.5 flex items-center justify-end gap-2 text-xs text-white/60">
              <span>{currentUser.role}</span>
              <span className="rounded-full border border-coral/50 bg-coral/15 px-2 py-0.5 font-medium text-coral">
                <span className="sr-only">Organization: </span>
                {currentUser.organizationName}
              </span>
            </span>
          </p>
          <Link
            href="/login"
            className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-white/90 focus-visible:outline-white"
          >
            Logout
          </Link>
        </section>
      </nav>
    </header>
  );
}
