import { getSupabase, supabaseEnabled, DOCS_BUCKET } from "./supabase";
import type { TreeNode } from "./types";

/**
 * Document cloud storage (Supabase Storage object bucket).
 *
 * Each document is stored as one JSON object at `<userId>/<docId>.json`, so
 * users are isolated by path prefix. All calls no-op gracefully (return a
 * not-configured result) until Supabase env keys exist, so importing this is
 * safe in the un-configured prototype.
 *
 * Not yet wired into the editor save loop — that step needs a live bucket + the
 * signed-in Clerk user id. Once your bucket exists, call `saveDocumentToCloud`
 * from the autosave cycle (debounced) with the Clerk `userId`.
 */

export interface CloudResult {
  ok: boolean;
  error?: string;
}

const objectPath = (userId: string, docId: string) => `${userId}/${docId}.json`;

export { supabaseEnabled };

/** Upsert one document's JSON to the user's folder in the bucket. */
export async function saveDocumentToCloud(userId: string, doc: TreeNode, token?: string | null): Promise<CloudResult> {
  const sb = getSupabase(token);
  if (!sb) return { ok: false, error: "Supabase is not configured." };
  const body = new Blob([JSON.stringify(doc)], { type: "application/json" });
  const { error } = await sb.storage
    .from(DOCS_BUCKET)
    .upload(objectPath(userId, doc.id), body, { upsert: true, contentType: "application/json" });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Download + parse one document, or null if missing / not configured. */
export async function loadDocumentFromCloud(userId: string, docId: string, token?: string | null): Promise<TreeNode | null> {
  const sb = getSupabase(token);
  if (!sb) return null;
  const { data, error } = await sb.storage.from(DOCS_BUCKET).download(objectPath(userId, docId));
  if (error || !data) return null;
  try {
    return JSON.parse(await data.text()) as TreeNode;
  } catch {
    return null;
  }
}

/** List the doc ids the user has stored in the cloud. */
export async function listCloudDocuments(userId: string, token?: string | null): Promise<string[]> {
  const sb = getSupabase(token);
  if (!sb) return [];
  const { data, error } = await sb.storage.from(DOCS_BUCKET).list(userId, { limit: 1000 });
  if (error || !data) return [];
  return data.filter((f) => f.name.endsWith(".json")).map((f) => f.name.replace(/\.json$/, ""));
}

/** Permanently remove one document object. */
export async function deleteDocumentFromCloud(userId: string, docId: string, token?: string | null): Promise<CloudResult> {
  const sb = getSupabase(token);
  if (!sb) return { ok: false, error: "Supabase is not configured." };
  const { error } = await sb.storage.from(DOCS_BUCKET).remove([objectPath(userId, docId)]);
  return error ? { ok: false, error: error.message } : { ok: true };
}
