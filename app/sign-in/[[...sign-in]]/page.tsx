import { SignIn } from "@clerk/nextjs";
import { AuthShell, AuthNotConfigured, clerkInCardAppearance } from "@/components/auth/AuthShell";

export const metadata = { title: "Sign in · Authorr" };

const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function SignInPage() {
  return (
    <AuthShell
      heading="Welcome back"
      sub="Sign in to open your writing studio."
      footerText="Don't have an account?"
      footerLink="Sign up free"
      footerHref="/sign-up"
    >
      {clerkEnabled ? (
        <SignIn signUpUrl="/sign-up" fallbackRedirectUrl="/app" appearance={clerkInCardAppearance} />
      ) : (
        <AuthNotConfigured />
      )}
    </AuthShell>
  );
}
