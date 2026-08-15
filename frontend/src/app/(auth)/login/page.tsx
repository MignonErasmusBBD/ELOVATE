import { Suspense } from "react";
import { SignInForm } from "@/features/login";

export default function LoginRoutePage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
