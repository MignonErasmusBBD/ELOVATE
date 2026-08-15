import { Suspense } from "react";
import { SignInForm } from "@/features/login";

export default function HomePage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
