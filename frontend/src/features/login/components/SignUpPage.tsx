import { AuthShell } from "./AuthShell";
import { SignUpForm } from "./SignUpForm";

export function SignUpPage() {
  return (
    <AuthShell>
      <SignUpForm />
    </AuthShell>
  );
}
