import {
  ActionFeedbackProvider,
  AppShell,
  CurrentUserProvider,
} from "@/features/platform";

export default function PlatformLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <CurrentUserProvider>
      <ActionFeedbackProvider>
        <AppShell>{children}</AppShell>
      </ActionFeedbackProvider>
    </CurrentUserProvider>
  );
}
