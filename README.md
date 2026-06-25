# Authorr (EasyFrame Writer)

A distraction-free, high-performance writing platform for creators. Next.js 16 (App
Router, Turbopack) · React 19 · TypeScript · TipTap v3 · Zustand · Tailwind v4 ·
Clerk (auth) · Supabase Storage (documents).

- Marketing site: `/`
- The writing app: `/app` (requires sign-in when Clerk is configured)

## Quick start

```bash
npm install
cp .env.local.example .env.local   # then fill in your keys
npm run dev                         # http://localhost:3000
```

The app runs without any keys — auth and cloud storage are graceful no-ops until
their env vars are present (it falls back to local `localStorage` persistence).

## Environment variables

Copy `.env.local.example` → `.env.local` and fill in. **Never commit `.env.local`** —
it is git-ignored. Set the same variables in your Vercel project settings.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | for auth | Clerk → API keys |
| `CLERK_SECRET_KEY` | for auth | Clerk → API keys (server only) |
| `NEXT_PUBLIC_SUPABASE_URL` | for cloud | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | for cloud | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_DOCS_BUCKET` | optional | defaults to `documents` |

## Supabase document storage — setup (required for cloud save)

Documents are stored as one JSON object per document at `<userId>/<docId>.json` in a
Storage bucket. **The code is wired** (`lib/docStorage.ts`, `components/CloudSync.tsx`);
saves only work once the bucket + access policies exist. Do this in your Supabase project:

**1. Create the bucket**
Storage → New bucket → name it **`documents`** (private is fine).

**2. Add Storage RLS policies.** Storage has row-level security on `storage.objects`
with no policies by default, so every upload is denied until you add policies. Run this
in the SQL editor.

*Prototype (works immediately, NOT per-user isolated — fine for testing):*
```sql
create policy "anon read documents"   on storage.objects for select using  (bucket_id = 'documents');
create policy "anon write documents"  on storage.objects for insert with check (bucket_id = 'documents');
create policy "anon update documents" on storage.objects for update using  (bucket_id = 'documents');
create policy "anon delete documents" on storage.objects for delete using  (bucket_id = 'documents');
```

*Production (per-user isolation by the `<userId>/` path prefix):* configure Clerk as a
Supabase third-party auth provider, add a Clerk **JWT template named `supabase`**, and
the app will send that token automatically (`CloudSync` calls `getToken({ template: "supabase" })`).
Then scope the policies to the path:
```sql
create policy "users read own"   on storage.objects for select using  (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.jwt() ->> 'sub');
create policy "users write own"  on storage.objects for insert with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.jwt() ->> 'sub');
create policy "users update own" on storage.objects for update using  (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.jwt() ->> 'sub');
create policy "users delete own" on storage.objects for delete using  (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.jwt() ->> 'sub');
```

**3. Sign in.** `/app` is auth-gated; cloud sync only runs for a signed-in user. The
cloud status (☁) shows in the top bar — hover it to see any error message.

**4. Restart the dev server** after changing `.env.local` (Next inlines `NEXT_PUBLIC_*`
at build time).

> If documents still don't save, the top-bar ☁ indicator turns red — hover it for the
> exact Supabase error (almost always "bucket not found" or an RLS policy denial, both
> fixed by steps 1–2).

## Clerk auth — setup

1. Create a Clerk application; copy the publishable + secret keys into `.env.local`.
2. The sign-in / sign-up pages live at `/sign-in` and `/sign-up`; `proxy.ts` gates `/app`.
3. (Optional, for Supabase isolation) add the `supabase` JWT template described above.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **New Project** → import the repo (framework auto-detects Next.js).
3. Add all environment variables from the table above (Production + Preview).
4. Deploy. Build command `next build` and output are auto-detected; no `vercel.json` needed.
5. In Clerk, add your Vercel domain to the allowed origins; in Supabase, no extra step
   (the anon key + RLS policies already cover it).

## Scripts

- `npm run dev` — dev server (port 3000)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint

See `AGENTS.md` for the full architecture/feature reference.
