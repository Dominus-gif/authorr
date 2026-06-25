import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

/**
 * Next 16 renamed `middleware` → `proxy` (Node.js runtime by default).
 * This gates the application shell behind Clerk auth: the marketing site (`/`)
 * stays public, while `/app` requires a signed-in user.
 *
 * Auth is a graceful no-op until BOTH Clerk keys are present in the env, so the
 * project keeps running locally before keys are configured.
 */
const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY;

const isProtectedRoute = createRouteMatcher(["/app(.*)"]);

// Safe to construct at module load — Clerk only reads the keys when the returned
// handler is actually invoked, which we gate behind `clerkConfigured`.
const handler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  if (!clerkConfigured) return NextResponse.next();
  return handler(req, event);
}

export const config = {
  matcher: [
    // Run on app routes, skipping Next internals and static assets.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run on API routes.
    "/(api|trpc)(.*)",
  ],
};
