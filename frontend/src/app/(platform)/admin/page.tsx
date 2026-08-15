import type { Metadata } from "next";
import { OrgAdminPage } from "@/features/admin";

export const metadata: Metadata = {
  title: "Organisational Admin",
  description:
    "Add people, assign Organisational Admin and Educator, and manage private courses.",
};

export default function AdminRoutePage() {
  return <OrgAdminPage />;
}
