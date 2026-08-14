import type { Metadata } from "next";
import { PlatformAdminPage } from "@/features/admin";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "Create organisations, assign Platform Admin and Community Admin, and assign Organisational Admin per organisation.",
};

export default function PlatformAdminRoutePage() {
  return <PlatformAdminPage />;
}
