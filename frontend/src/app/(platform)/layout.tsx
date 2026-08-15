import { AppShell, CurrentUserProvider } from "@/features/platform";

export default function PlatformLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <CurrentUserProvider>
      <AppShell>{children}</AppShell>
    </CurrentUserProvider>
  );
}
