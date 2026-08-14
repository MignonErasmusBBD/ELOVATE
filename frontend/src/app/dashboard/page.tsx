import { redirect } from "next/navigation";

/**
 * Redirect returning users to courses for now.
 * Replace with a real dashboard component when ready.
 */
export default function DashboardPage() {
  redirect("/courses");
}
