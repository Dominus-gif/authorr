import { SignUp } from "@clerk/nextjs";
import { AuthShell, AuthNotConfigured, clerkInCardAppearance } from "@/components/auth/AuthShell";

export const metadata = { title: "Create your account · Authorr" };

const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function SignUpPage() {
  return (
    <AuthShell
      heading="Start writing — free"
      sub="Create your account and open the canvas."
      footerText="Already have an account?"
      footerLink="Sign in"
      footerHref="/sign-in"
    >
      {clerkEnabled ? (
        <SignUp signInUrl="/sign-in" fallbackRedirectUrl="/app" appearance={clerkInCardAppearance} />
      ) : (
        <AuthNotConfigured />
      )}
    </AuthShell>
  );
}
