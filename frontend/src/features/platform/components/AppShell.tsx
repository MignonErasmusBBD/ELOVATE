"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  getAllPlatformNavSections,
  isPlatformNavItemActive,
} from "../navConfig";

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

function getNavItemInitial(label: string) {
  if (label === "Organisational Admin") {
    return "OA";
  }
  if (label === "Community Admin") {
    return "CA";
  }
  if (label === "Platform Admin") {
    return "PA";
  }
  return label.slice(0, 1);
}

function readToken(body: object): string | undefined {
  if ("token" in body === false) {
    return undefined;
  }
  const token = body.token;
  if (typeof token !== "string" || token === "") {
    return undefined;
  }
  return token;
}

function readStringList(body: object, key: string): string[] {
  if (key in body === false) {
    return [];
  }
  const field = Reflect.get(body, key);
  if (Array.isArray(field) === false) {
    return [];
  }
  const values: string[] = [];
  for (const item of field) {
    if (typeof item === "string" && item !== "") {
      values.push(item);
    }
  }
  return values;
}

function readOptionalString(body: object, key: string): string | undefined {
  if (key in body === false) {
    return undefined;
  }
  const field = Reflect.get(body, key);
  if (typeof field !== "string" || field === "") {
    return undefined;
  }
  return field;
}

function AccountHeader() {
  const session = authClient.useSession();
  const sessionUser = session.data?.user;
  const [roleNames, setRoleNames] = useState<string[]>([]);
  const [organizationName, setOrganizationName] = useState<string | undefined>();

  useEffect(() => {
    if (sessionUser === undefined) {
      return;
    }

    let cancelled = false;

    async function loadAccountDetails() {
      const tokenResponse = await fetch("/api/auth/token");
      if (tokenResponse.ok === false) {
        return;
      }
      const tokenBody = await tokenResponse.json();
      if (
        typeof tokenBody !== "object" ||
        tokenBody === null ||
        Array.isArray(tokenBody)
      ) {
        return;
      }
      const accessToken = readToken(tokenBody);
      if (accessToken === undefined) {
        return;
      }

      const profileResponse = await fetch("/elovate-api/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (profileResponse.ok === false) {
        return;
      }
      const profileBody = await profileResponse.json();
      if (
        typeof profileBody !== "object" ||
        profileBody === null ||
        Array.isArray(profileBody)
      ) {
        return;
      }
      if (cancelled) {
        return;
      }
      setRoleNames(readStringList(profileBody, "roles"));
      setOrganizationName(readOptionalString(profileBody, "organizationName"));
    }

    void loadAccountDetails();
    return () => {
      cancelled = true;
    };
  }, [sessionUser]);

  if (sessionUser === undefined) {
    return (
      <p className="min-w-0 text-right text-sm text-text-secondary">
        Not signed in
      </p>
    );
  }

  const fullName =
    sessionUser.name === undefined || sessionUser.name === ""
      ? sessionUser.email
      : sessionUser.name;

  return (
    <p className="min-w-0 text-right">
      <span className="block truncate text-sm font-medium text-ink">
        {fullName}
      </span>
      <span className="block truncate text-xs text-text-secondary">
        {sessionUser.email}
      </span>
      <span className="mt-1 flex flex-wrap items-center justify-end gap-1.5">
        {roleNames.map((roleName) => (
          <span
            key={roleName}
            className="rounded-full border border-border-ui bg-page px-2 py-0.5 text-xs font-medium text-text-secondary"
          >
            {roleName}
          </span>
        ))}
        {organizationName === undefined ? undefined : (
          <span className="rounded-full border border-coral/40 bg-coral/10 px-2 py-0.5 text-xs font-medium text-coral">
            <span className="sr-only">Organisation: </span>
            {organizationName}
          </span>
        )}
      </span>
    </p>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navSections = getAllPlatformNavSections();
  const desktopSidebarWidthClass = isSidebarCollapsed
    ? "lg:w-[4.5rem]"
    : "lg:w-72";
  const desktopContentOffsetClass = isSidebarCollapsed
    ? "lg:pl-[4.5rem]"
    : "lg:pl-72";

  return (
    <div className="min-h-dvh bg-page">
      {isMobileNavOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      ) : undefined}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 flex-col border-r border-white/10 bg-ink text-white transition-[width,transform] duration-200 ${desktopSidebarWidthClass} ${
          isMobileNavOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <header
          className={`flex items-center gap-3 border-b border-white/10 px-4 py-4 ${
            isSidebarCollapsed ? "lg:justify-center lg:px-2" : ""
          }`}
        >
          <Link
            href="/courses"
            className="min-w-0 focus-visible:outline-white"
            onClick={() => setIsMobileNavOpen(false)}
          >
            {isSidebarCollapsed ? (
              <span className="hidden text-sm font-bold tracking-wide lg:inline">
                E
              </span>
            ) : undefined}
            <span
              className={`block truncate text-sm font-bold tracking-wide ${
                isSidebarCollapsed ? "lg:hidden" : ""
              }`}
            >
              ELOVATE
            </span>
            <span
              className={`mt-0.5 block text-xs text-white/55 ${
                isSidebarCollapsed ? "lg:hidden" : ""
              }`}
            >
              Learning Platform
            </span>
          </Link>
        </header>

        <nav
          aria-label="Primary"
          className="min-h-0 flex-1 overflow-y-auto px-2 py-4"
        >
          <ul className="flex list-none flex-col gap-5 p-0">
            {navSections.map((section) => (
              <li key={section.id}>
                <p
                  className={`px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/40 ${
                    isSidebarCollapsed ? "lg:sr-only" : ""
                  }`}
                >
                  {section.label}
                </p>
                <ul className="flex list-none flex-col gap-1 p-0">
                  {section.items.map((item) => {
                    const isCurrent = isPlatformNavItemActive(
                      pathname,
                      item.href,
                    );

                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          aria-current={isCurrent ? "page" : undefined}
                          title={item.description}
                          onClick={() => setIsMobileNavOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-visible:outline-white ${
                            isCurrent
                              ? "bg-white/10 font-semibold text-coral"
                              : "font-medium text-white/70 hover:bg-white/5 hover:text-white"
                          } ${isSidebarCollapsed ? "lg:justify-center lg:px-2" : ""}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[0.65rem] font-bold ${
                              isCurrent
                                ? "bg-coral/20 text-coral"
                                : "bg-white/10 text-white/80"
                            }`}
                          >
                            {getNavItemInitial(item.label)}
                          </span>
                          <span
                            className={isSidebarCollapsed ? "lg:sr-only" : ""}
                          >
                            <span className="block">{item.label}</span>
                            <span className="mt-0.5 block text-xs font-normal text-white/45">
                              {item.description}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        <footer className="hidden shrink-0 border-t border-white/10 p-3 lg:block">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((current) => !current)}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white focus-visible:outline-white"
          >
            {isSidebarCollapsed ? "»" : "« Collapse"}
          </button>
        </footer>
      </aside>

      <div
        className={`flex min-h-dvh min-w-0 flex-col transition-[padding] duration-200 ${desktopContentOffsetClass}`}
      >
        <header className="sticky top-0 z-30 border-b border-border-ui bg-surface/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 md:px-6">
            <button
              type="button"
              className="rounded-lg border border-border-ui px-3 py-2 text-sm font-semibold text-ink hover:bg-page lg:hidden"
              onClick={() => setIsMobileNavOpen(true)}
            >
              Menu
            </button>

            <p className="min-w-0 flex-1 truncate text-sm text-text-secondary lg:hidden">
              ELOVATE
            </p>

            <section
              aria-label="Account"
              className="ml-auto flex min-w-0 items-center gap-3"
            >
              <AccountHeader />
              <Link
                href="/login"
                className="shrink-0 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                Logout
              </Link>
            </section>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
