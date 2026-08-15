import { AppShell } from "@/features/platform";

export default function PlatformLayout({
  children,
}: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
