// Diagnostic: exercises the exact Supabase Storage flow the app uses, with the
// anon key, and reports the precise error at each step. Run: node scripts/test-supabase.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- load .env.local without printing secrets ---
const env = {};
try {
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch (e) {
  console.error("Could not read .env.local:", e.message);
  process.exit(1);
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const bucket = env.NEXT_PUBLIC_SUPABASE_DOCS_BUCKET || "documents";

console.log("URL present:", !!url, "| host:", url ? new URL(url).host : "—");
console.log("Anon key present:", !!anon, "| length:", anon?.length ?? 0);
console.log("Bucket:", bucket);
if (!url || !anon) { console.error("\nMissing URL or anon key."); process.exit(1); }

const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
const testUser = "diagnostic-user";
const path = `${testUser}/test-${Date.now()}.json`;

const step = async (name, fn) => {
  try {
    const { data, error } = await fn();
    if (error) { console.log(`❌ ${name}: ${error.message}${error.statusCode ? " (status " + error.statusCode + ")" : ""}`); return { error }; }
    console.log(`✅ ${name}`);
    return { data };
  } catch (e) { console.log(`❌ ${name}: ${e.message}`); return { error: e }; }
};

console.log("\n--- Storage flow ---");
await step("list buckets", () => sb.storage.listBuckets());
await step(`upload ${path}`, () =>
  sb.storage.from(bucket).upload(path, new Blob([JSON.stringify({ hello: "world" })], { type: "application/json" }), { upsert: true, contentType: "application/json" }));
await step(`list ${testUser}/`, () => sb.storage.from(bucket).list(testUser));
const dl = await step(`download ${path}`, () => sb.storage.from(bucket).download(path));
if (dl.data) console.log("   content:", await dl.data.text());
await step(`remove ${path}`, () => sb.storage.from(bucket).remove([path]));
console.log("\nDone.");
