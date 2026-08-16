import type { Metadata } from "next";
import { PlatformAdminPage } from "@/features/admin";

export const metadata: Metadata = {
  title: "Platform Admin",
  description:
    "Create organisations, assign Platform Admin and Community Admin, and assign Org Admin per organisation.",
};

export default function PlatformAdminRoutePage() {
  return <PlatformAdminPage />;
}
