import type { ReactNode } from "react";
import { BrandPanel } from "./BrandPanel";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="flex min-h-screen flex-col md:flex-row">
      <BrandPanel />
      <section className="flex flex-1 items-center justify-center bg-page px-6 py-12 md:px-12">
        {children}
      </section>
    </main>
  );
}
