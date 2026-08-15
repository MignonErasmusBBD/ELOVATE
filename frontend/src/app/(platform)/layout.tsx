import { AppShell } from "@/features/platform";
import { getCurrentUser } from "@/lib/session";

export default async function PlatformLayout({
  children,
}: LayoutProps<"/">) {
  const currentUser = await getCurrentUser();

  return <AppShell currentUser={currentUser}>{children}</AppShell>;
}
