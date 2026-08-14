import type { Metadata } from "next";
import { CommunityAdminPage } from "@/features/admin";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Add and curate public courses available to every learner across organisations.",
};

export default function CommunityAdminRoutePage() {
  return <CommunityAdminPage />;
}
