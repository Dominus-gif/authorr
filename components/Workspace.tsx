"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor as TiptapEditor } from "@tiptap/react";
import { Minimize2 } from "lucide-react";
import { useStore, selectActiveDoc, personalCollabLimitReached, collabEditsRemaining } from "@/lib/store";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { AIPanel } from "./AIPanel";
import { ProfessionalPanel } from "./ProfessionalPanel";
import { ScriptPanel } from "./ScriptPanel";
import { AcademicPanel } from "./AcademicPanel";
import { Corkboard } from "./Corkboard";
import { pageWidth } from "@/lib/pageSizes";
import { StatsBar } from "./StatsBar";
import Editor from "./Editor";
import { EditorContext } from "./EditorContext";
import { Toolbar } from "./Toolbar";
import { Toast } from "./Toast";
import { AssignRequest } from "./AssignRequest";
import { VersionHistory } from "./VersionHistory";
import { RequestDetail } from "./RequestDetail";
import { DocMetadata } from "./DocMetadata";
import { CollabDialog } from "./CollabDialog";
import { UpgradePrompt } from "./UpgradePrompt";
import { PlanUpgradeModal } from "./PlanUpgradeModal";
import { CloudSync } from "./CloudSync";
import { Timer } from "./Timer";
import { supabaseEnabled } from "@/lib/supabase";

// Cloud sync runs only when both auth (Clerk) and storage (Supabase) are configured.
const cloudReady = supabaseEnabled && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
import { PasscodeDialog } from "./PasscodeDialog";
import { LockScreen } from "./LockScreen";
import { PromptDialog } from "./PromptDialog";
import { ShareDialog } from "./ShareDialog";
import { FindReplace } from "./FindReplace";
import { DoodleOverlay } from "./DoodleOverlay";
import { ScrollMarkers } from "./ScrollMarkers";
import { SymbolPicker } from "./SymbolPicker";
import { TranslatePanel } from "./TranslatePanel";
import { SidePanel } from "./SidePanel";
import { CloudDialog } from "./CloudDialog";
import { TemplatesDialog } from "./TemplatesDialog";
import { TrashDialog } from "./TrashDialog";
import { AccountDialog } from "./AccountDialog";
import { RequestsTimeline } from "./RequestsTimeline";
import { EmbedDialog } from "./EmbedDialog";
import { CommentTooltip } from "./CommentTooltip";
import { DocOutline } from "./DocOutline";
import { AdminDashboard } from "./AdminDashboard";
import { canEdit } from "@/lib/permissions";
import { ROLE_META } from "@/lib/types";
import { Eye, Ban } from "lucide-react";
import { ResizeHandle } from "./ResizeHandle";

export function Workspace() {
  const hydrated = useStore((s) => s.hydrated);
  const { zen, sidebarOpen, aiPanelOpen, splitView, toggleZen, setTheme, theme, setFont, font } =
    useStore();
  const workMode = useStore((s) => s.workMode);
  const plan = useStore((s) => s.plan);
  const setWorkMode = useStore((s) => s.setWorkMode);
  // Free plan: the writing assistant is limited to the casual style. Normalize
  // any persisted premium mode back to casual so the panel + editor agree.
  useEffect(() => {
    if (plan === "free" && workMode !== "casual") setWorkMode("casual");
  }, [plan, workMode, setWorkMode]);
  const zoom = useStore((s) => s.zoom);
  const pageBorders = useStore((s) => s.pageBorders);
  const pageColors = useStore((s) => s.pageColors);
  const paperTextures = useStore((s) => s.paperTextures);
  const grid = useStore((s) => s.grid);
  const pageMargin = useStore((s) => s.pageMargin);
  // Grid/texture line color: a custom color (locked, survives theme switches) or
  // the theme text (auto-inverts on theme change). Opacity is folded in here.
  const gridOp = Math.round(grid.opacity * 100);
  const gridBase = grid.color ?? "var(--text)";
  const gridVars: Record<string, string> = {
    "--paper-rule": `color-mix(in srgb, ${gridBase} ${gridOp}%, transparent)`,
    "--paper-rule-strong": `color-mix(in srgb, ${gridBase} ${Math.min(100, gridOp + 12)}%, transparent)`,
    "--paper-cell": `${grid.cellSize}px`,
    "--paper-dot-gap": `${grid.dotDistance}px`,
    // Margin-guide inset tracks the page padding (or custom margin).
    "--guide-y": pageMargin > 0 ? `${pageMargin}px` : "56px",
    "--guide-x": pageMargin > 0 ? `${pageMargin}px` : "64px",
  };
  const sceneNumbers = useStore((s) => s.sceneNumbers);
  const infiniteCanvas = useStore((s) => s.infiniteCanvas);
  const pageSize = useStore((s) => s.pageSize);
  const aiSuiteOverride = useStore((s) => s.aiSuiteOverride);
  const archiveOpen = useStore((s) => s.archiveOpen);
  const archiveTasks = useStore((s) => s.editTasks);
  const versionHistoryOpen = useStore((s) => s.versionHistoryOpen);
  const setVersionHistoryOpen = useStore((s) => s.setVersionHistoryOpen);
  const doc = useStore(selectActiveDoc);
  const unlockedDocs = useStore((s) => s.unlockedDocs);
  const autoLockMinutes = useStore((s) => s.autoLockMinutes);
  const lockAll = useStore((s) => s.lockAll);
  const role = useStore((s) => s.users.find((u) => u.id === s.currentUserId)?.role ?? "author");
  const edition = useStore((s) => s.edition);
  const limitReached = useStore(personalCollabLimitReached);
  const remaining = useStore(collabEditsRemaining);
  const notesWidth = useStore((s) => s.notesWidth);
  const setPanelWidth = useStore((s) => s.setPanelWidth);
  const autosaveEnabled = useStore((s) => s.autosaveEnabled);
  const autosaveMinutes = useStore((s) => s.autosaveMinutes);
  const connectedClouds = useStore((s) => s.connectedClouds);
  const bookmarks = useStore((s) => s.bookmarks);

  const docLocked = !!doc?.passcodeHash && !unlockedDocs.includes(doc.id);
  const teamMode = doc?.collabMode === "team";
  const countsAsCollab = teamMode && edition === "personal";
  const collabBlocked = countsAsCollab && limitReached;
  const readOnly = !canEdit(role);

  const [text, setText] = useState("");
  const [editor, setEditor] = useState<TiptapEditor | null>(null);
  const [, setSelTick] = useState(0);

  // Zen fade-on-typing + edge reveal
  const [typing, setTyping] = useState(false);
  const [edgeReveal, setEdgeReveal] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-apply persisted theme/font after hydration.
  useEffect(() => {
    if (hydrated) {
      setTheme(theme);
      setFont(font);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Track selection changes so the AI panel knows if text is selected.
  useEffect(() => {
    if (!editor) return;
    const bump = () => setSelTick((t) => t + 1);
    editor.on("selectionUpdate", bump);
    editor.on("transaction", bump);
    return () => {
      editor.off("selectionUpdate", bump);
      editor.off("transaction", bump);
    };
  }, [editor]);

  // Auto-lock passcode-protected notes after inactivity.
  useEffect(() => {
    if (unlockedDocs.length === 0) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => lockAll(), autoLockMinutes * 60 * 1000);
    };
    const events: (keyof WindowEventMap)[] = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, true));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset, true));
    };
  }, [unlockedDocs.length, autoLockMinutes, lockAll]);

  // Time-based autosave: periodically snapshot a version (and "sync to cloud").
  useEffect(() => {
    if (!autosaveEnabled || !editor) return;
    const id = setInterval(() => {
      const st = useStore.getState();
      const d = selectActiveDoc(st);
      if (!d) return;
      const txt = editor.getText();
      const words = txt.trim() ? txt.trim().split(/\s+/).filter(Boolean).length : 0;
      st.pushVersion(d.id, editor.getHTML(), words, true);
      st.showToast(connectedClouds.length ? "Auto-saved · synced to cloud" : "Auto-saved");
    }, Math.max(1, autosaveMinutes) * 60000);
    return () => clearInterval(id);
  }, [autosaveEnabled, autosaveMinutes, editor, connectedClouds.length]);

  // Ctrl/Cmd+F opens the in-app Find & Replace (overriding the browser's find).
  // 'M' (when not typing) cycles the 4 glass themes.
  useEffect(() => {
    const GLASS = ["glass-aurora", "glass-mint", "glass-sunset", "glass-frost"] as const;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        useStore.getState().setFindReplaceOpen(true);
        return;
      }
      // Zoom: Ctrl/Cmd + (= / + / - / 0)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && ["=", "+", "-", "0"].includes(e.key)) {
        e.preventDefault();
        const st = useStore.getState();
        const clamp = (z: number) => Math.min(2, Math.max(0.5, Math.round(z * 100) / 100));
        if (e.key === "0") st.setZoom(1);
        else if (e.key === "-") st.setZoom(clamp(st.zoom - 0.1));
        else st.setZoom(clamp(st.zoom + 0.1));
        return;
      }
      // Alt+D toggles page doodle mode (when not typing)
      if ((e.key === "d" || e.key === "D") && e.altKey && !e.ctrlKey && !e.metaKey) {
        const t = e.target as HTMLElement | null;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        e.preventDefault();
        useStore.getState().toggleDoodleMode();
        return;
      }
      if ((e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const t = e.target as HTMLElement | null;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        e.preventDefault();
        const st = useStore.getState();
        // Glass themes are premium — gate the quick-cycle on Free.
        if (!st.requireFeature("premiumThemes")) return;
        const idx = GLASS.indexOf(st.theme as (typeof GLASS)[number]);
        st.setTheme(GLASS[(idx + 1) % GLASS.length]);
        st.showToast(`Theme · ${GLASS[(idx + 1) % GLASS.length].replace("glass-", "")}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Restore the saved bookmark scroll position when a document opens.
  useEffect(() => {
    if (!doc) return;
    const ratio = bookmarks[doc.id];
    if (ratio == null) return;
    const t = setTimeout(() => {
      const sc = document.querySelector("[data-editor-scroll]") as HTMLElement | null;
      if (sc) sc.scrollTop = ratio * Math.max(1, sc.scrollHeight - sc.clientHeight);
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id]);

  const handleText = useCallback((t: string) => {
    setText(t);
    setTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 1600);
  }, []);

  // Edge reveal in zen mode.
  useEffect(() => {
    if (!zen) return;
    const onMove = (e: MouseEvent) => setEdgeReveal(e.clientY < 64);
    window.addEventListener("mousemove", onMove);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") toggleZen();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [zen, toggleZen]);

  if (!hydrated) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-tertiary)",
          fontSize: 13,
        }}
      >
        Loading workspace…
      </div>
    );
  }

  const chromeVisible = !zen || edgeReveal || !typing;

  return (
    <EditorContext.Provider value={editor}>
    <div data-script-mode={workMode === "scriptwriting" ? "" : undefined} data-scene-numbers={workMode === "scriptwriting" && sceneNumbers ? "" : undefined} style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar (hidden in zen) */}
      {!zen && <TopBar />}

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {!zen && sidebarOpen && <Sidebar />}

        <main style={{ flex: 1, display: "flex", minWidth: 0 }}>
          {/* Split view: notes */}
          {!zen && splitView && (
            <div
              style={{
                width: notesWidth,
                flexShrink: 0,
                position: "relative",
                borderRight: "1px solid var(--border)",
                background: "var(--bg-elev)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <ResizeHandle side="right" width={notesWidth} min={240} max={560} onChange={(w) => setPanelWidth("notes", w)} />
              <SidePanel />
            </div>
          )}

          {/* Editor column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
            {!zen && <Toolbar />}
            {!zen && readOnly && doc && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 16px",
                  fontSize: 12,
                  color: "var(--warning)",
                  background: "color-mix(in srgb, var(--warning) 12%, transparent)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <Eye size={14} />
                Read-only — your role ({ROLE_META[role].label}) can view and comment, not edit.
              </div>
            )}
            {!zen && !readOnly && collabBlocked && doc && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 16px",
                  fontSize: 12,
                  color: "var(--danger)",
                  background: "color-mix(in srgb, var(--danger) 12%, transparent)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <Ban size={14} />
                Daily collaboration limit reached. You can continue editing tomorrow.
              </div>
            )}
            {!zen && !readOnly && !collabBlocked && countsAsCollab && remaining <= 10 && doc && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 16px",
                  fontSize: 12,
                  color: "var(--warning)",
                  background: "color-mix(in srgb, var(--warning) 10%, transparent)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <Ban size={13} />
                {remaining} collaborative edit{remaining === 1 ? "" : "s"} left today (Personal plan).
              </div>
            )}
            <div
              data-editor-scroll
              style={{
                flex: 1,
                position: "relative",
                overflowY: "auto",
                padding: zen ? "8vh 24px 24vh" : "32px 24px 30vh",
              }}
            >
              {/* Doodle scope is the FIXED-WIDTH content wrapper, so strokes stay
                  locked to the text when the window resizes (the scroller width
                  changes, but this 720px column doesn't). */}
              <div
                data-doodle-scope
                data-page-borders={pageBorders && !infiniteCanvas ? "" : undefined}
                data-infinite-canvas={infiniteCanvas ? "" : undefined}
                data-paper-texture={doc && paperTextures[doc.id] ? paperTextures[doc.id] : undefined}
                style={{ ...gridVars, maxWidth: infiniteCanvas ? "100%" : pageWidth(pageSize), width: infiniteCanvas ? "100%" : undefined, margin: infiniteCanvas ? 0 : "0 auto", position: "relative", zoom, minHeight: infiniteCanvas ? "calc(100vh - 180px)" : undefined, ...(pageMargin > 0 && pageBorders && !infiniteCanvas ? { padding: pageMargin } : null), ...(doc && pageColors[doc.id] ? { backgroundColor: pageColors[doc.id] } : null) } as React.CSSProperties}
              >
                {doc ? (
                  <Editor
                    key={doc.id}
                    docId={doc.id}
                    initialContent={doc.content ?? "<p></p>"}
                    onTextChange={handleText}
                    onEditorReady={setEditor}
                    collabReadOnly={collabBlocked}
                    countsAsCollab={countsAsCollab}
                  />
                ) : (
                  <p style={{ color: "var(--text-tertiary)" }}>
                    No document selected. Create one from the sidebar.
                  </p>
                )}
              </div>
            </div>
            {docLocked && doc && <LockScreen doc={doc} />}

            {/* Stats bar (faded in zen) */}
            {!zen && <StatsBar text={text} />}
          </div>
        </main>

        {!zen && aiPanelOpen && (
          // AI editing suite is always reachable: forced via the top-bar AI
          // toggle, and the default in Casual mode (restored).
          aiSuiteOverride ? <AIPanel text={text} editor={editor} /> :
          workMode === "scriptwriting" ? <ScriptPanel /> :
          workMode === "academic" ? <AcademicPanel /> :
          workMode === "professional" ? <ProfessionalPanel text={text} editor={editor} /> :
          workMode === "casual" ? <AIPanel text={text} editor={editor} casual /> :
          <AIPanel text={text} editor={editor} />
        )}
      </div>

      {/* Zen floating controls */}
      {zen && (
        <div
          className="fade-ui"
          style={{
            position: "fixed",
            top: 14,
            right: 16,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "8px 14px",
            borderRadius: 999,
            background: "var(--bg-elev-2)",
            border: "1px solid var(--border)",
            opacity: chromeVisible ? 1 : 0,
            pointerEvents: chromeVisible ? "auto" : "none",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            {text.trim() ? text.trim().split(/\s+/).length.toLocaleString() : 0} words
          </span>
          <button
            onClick={toggleZen}
            title="Exit zen mode (Esc)"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--text-secondary)",
            }}
          >
            <Minimize2 size={14} />
            Exit
          </button>
        </div>
      )}

      {versionHistoryOpen && (
        <VersionHistory onClose={() => setVersionHistoryOpen(false)} />
      )}
      <AssignRequest />
      <RequestDetail />
      <DocMetadata />
      <CollabDialog />
      <UpgradePrompt />
      <PlanUpgradeModal />
      {cloudReady && <CloudSync />}
      <Timer />
      <PasscodeDialog />
      <ShareDialog />
      <FindReplace />
      <DoodleOverlay />
      <ScrollMarkers />
      <SymbolPicker />
      <TranslatePanel />
      <CloudDialog />
      <TemplatesDialog />
      <TrashDialog />
      <AccountDialog />
      {archiveOpen && <RequestsTimeline tasks={archiveTasks} onClose={() => useStore.getState().setArchiveOpen(false)} />}
      <EmbedDialog />
      <CommentTooltip />
      <DocOutline />
      <Corkboard />
      <AdminDashboard />
      <PromptDialog />
      <Toast />
    </div>
    </EditorContext.Provider>
  );
}
