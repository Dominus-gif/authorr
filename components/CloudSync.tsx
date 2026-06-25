"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useStore, selectActiveDoc } from "@/lib/store";
import {
  supabaseEnabled,
  saveDocumentToCloud,
  listCloudDocuments,
  loadDocumentFromCloud,
} from "@/lib/docStorage";

/**
 * Bridges the editor to Supabase Storage. Rendered in the workspace only when
 * both Clerk and Supabase are configured. On first load it pulls the signed-in
 * user's documents from the bucket and merges them in; thereafter it debounce-
 * pushes the active document whenever its content changes. Renders nothing.
 */
export function CloudSync() {
  const { isSignedIn, userId, getToken } = useAuth();
  const activeDoc = useStore(selectActiveDoc);
  const setCloudStatus = useStore((s) => s.setCloudStatus);
  const mergeCloudDocs = useStore((s) => s.mergeCloudDocs);
  const loadedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContentRef = useRef<Record<string, string>>({});

  // A Clerk-issued Supabase JWT (if the "supabase" JWT template is configured),
  // so requests authenticate as the user and path-scoped RLS can isolate them.
  // Falls back to null (anon role) when the template isn't set up.
  const supabaseToken = async () => {
    try { return await getToken({ template: "supabase" }); }
    catch { return null; }
  };

  // Initial pull from the cloud (once per signed-in session).
  useEffect(() => {
    if (!isSignedIn || !userId || !supabaseEnabled || loadedRef.current) return;
    loadedRef.current = true;
    let cancelled = false;
    (async () => {
      setCloudStatus("syncing");
      try {
        const token = await supabaseToken();
        const ids = await listCloudDocuments(userId, token);
        const docs = [];
        for (const id of ids) {
          const d = await loadDocumentFromCloud(userId, id, token);
          if (d) docs.push(d);
        }
        if (cancelled) return;
        if (docs.length) mergeCloudDocs(docs);
        setCloudStatus("synced");
      } catch (e) {
        if (!cancelled) setCloudStatus("error", e instanceof Error ? e.message : "Cloud load failed");
      }
    })();
    return () => { cancelled = true; };
  }, [isSignedIn, userId, setCloudStatus, mergeCloudDocs]);

  // Debounced push of the active document when its content changes.
  useEffect(() => {
    if (!isSignedIn || !userId || !supabaseEnabled || !activeDoc) return;
    const content = activeDoc.content ?? "";
    if (lastContentRef.current[activeDoc.id] === content) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const docSnapshot = activeDoc;
    timerRef.current = setTimeout(async () => {
      setCloudStatus("syncing");
      const token = await supabaseToken();
      const res = await saveDocumentToCloud(userId, docSnapshot, token);
      lastContentRef.current[docSnapshot.id] = content;
      setCloudStatus(res.ok ? "synced" : "error", res.error ?? null);
    }, 1500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isSignedIn, userId, activeDoc, setCloudStatus]);

  return null;
}
