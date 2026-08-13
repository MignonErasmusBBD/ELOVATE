import { AppNavbar } from "@/features/platform";
import { getCurrentUser } from "@/lib/session";

export default async function PlatformLayout({
  children,
}: LayoutProps<"/">) {
  const currentUser = await getCurrentUser();

  return (
    <>
      <AppNavbar currentUser={currentUser} />
      <main>{children}</main>
    </>
  );
}
