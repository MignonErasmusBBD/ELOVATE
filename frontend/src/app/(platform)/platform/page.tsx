import type { Metadata } from "next";
import { PlatformAdminPage } from "@/features/admin";

export const metadata: Metadata = {
  title: "Platform Admin",
  description:
    "Create organisations, assign platform_admin and community_admin, and assign org_admin per organisation.",
};

export default function PlatformAdminRoutePage() {
  return <PlatformAdminPage />;
}
