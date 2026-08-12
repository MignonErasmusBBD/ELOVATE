import { AuthShell } from "./AuthShell";
import { SignInForm } from "./SignInForm";

export function SignInPage() {
  return (
    <AuthShell>
      <SignInForm />
    </AuthShell>
  );
}
