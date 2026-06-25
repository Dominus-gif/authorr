"use client";

import { useState } from "react";
import {
  PanelLeft,
  Maximize2,
  SquarePen,
  Columns2,
  Check,
  History,
  Inbox,
  Info,
  Lock,
  Share2,
  LayoutDashboard,
  ListTree,
  Bookmark,
  SpellCheck,
  Sparkles,
  Cloud,
  CloudOff,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { supabaseEnabled } from "@/lib/supabase";
import { useStore, selectActiveDoc } from "@/lib/store";
import { STATUS_META, isTaskOpen, type DocStatus } from "@/lib/types";
import { PLAN_META } from "@/lib/plans";
import { ExportMenu } from "./ExportMenu";
import { UploadButton } from "./UploadButton";
import { RequestsPanel } from "./RequestsPanel";
import { EditionMenu } from "./EditionMenu";
import { ThemeMenu } from "./ThemeMenu";
import { ModeSwitcher } from "./ModeSwitcher";
import { ZoomControl } from "./ZoomControl";
import { ComfortControls, ScreenShade } from "./ComfortControls";

const STATUS_CYCLE: DocStatus[] = ["draft", "review", "published"];

function ToolButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 8,
        color: active ? "var(--accent)" : "var(--text-secondary)",
        background: active ? "var(--accent-soft)" : "transparent",
      }}
      onMouseEnter={(e) =>
        !active && (e.currentTarget.style.background = "var(--bg-elev-2)")
      }
      onMouseLeave={(e) =>
        !active && (e.currentTarget.style.background = "transparent")
      }
    >
      <Icon size={17} />
    </button>
  );
}

function SaveIndicator() {
  const status = useStore((s) => s.saveStatus);
  const map = {
    saving: { text: "Saving…", color: "var(--warning)", cls: "saving-dot" },
    saved: { text: "Saved", color: "var(--success)", cls: "" },
    synced: { text: "Synced", color: "var(--success)", cls: "" },
    idle: { text: "Saved", color: "var(--success)", cls: "" },
  }[status];
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "var(--text-tertiary)",
      }}
    >
      <span
        className={map.cls}
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: map.color,
        }}
      />
      {map.text}
    </span>
  );
}

export function TopBar() {
  const {
    toggleSidebar,
    sidebarOpen,
    toggleAIPanel,
    aiPanelOpen,
    pageBorders,
    setPageBorders,
    toggleSplitView,
    splitView,
    toggleZen,
    setStatus,
    renameNode,
    setVersionHistoryOpen,
    setMetadataOpen,
    setPasscodeDialogOpen,
    setShareDialogOpen,
    setAdminDashboardOpen,
    setAiSuiteOverride,
    requireFeature,
    setOutlineOpen,
    outlineOpen,
    setBookmark,
    showToast,
    autocorrect,
    setAutocorrect,
    editTasks,
    restoreRequests,
    accessRequests,
    currentUserId,
    users,
  } = useStore();
  const doc = useStore(selectActiveDoc);
  // Free plan hides premium top-bar controls entirely (not just gated).
  const isFree = useStore((s) => s.plan === "free");
  const docLocked = !!doc?.passcodeHash;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [requestsOpen, setRequestsOpen] = useState(false);

  const me = users.find((u) => u.id === currentUserId);
  const isAuthor = me?.role === "author";
  const openTasks = editTasks.filter((t) =>
    isTaskOpen(t.status) && (isAuthor ? t.requestedById === currentUserId : t.assigneeId === currentUserId),
  ).length;
  const pendingRestores = isAuthor
    ? restoreRequests.filter((r) => r.status === "pending").length
    : 0;
  const pendingAccess = isAuthor
    ? accessRequests.filter((r) => r.status === "pending").length
    : 0;
  const openRequests = openTasks + pendingRestores + pendingAccess;

  if (!doc) return null;

  const status = doc.status ?? "draft";
  const meta = STATUS_META[status];

  const cycleStatus = () => {
    const next =
      STATUS_CYCLE[(STATUS_CYCLE.indexOf(status) + 1) % STATUS_CYCLE.length];
    setStatus(doc.id, next);
  };

  return (
    <header
      style={{
        height: 52,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 12px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-elev)",
      }}
    >
      <ToolButton
        icon={PanelLeft}
        label="Toggle sidebar"
        active={sidebarOpen}
        onClick={toggleSidebar}
      />

      <ModeSwitcher />

      <EditionMenu />
      <PlanBadge />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flex: 1,
          minWidth: 0,
        }}
      >
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (draft.trim()) renameNode(doc.id, draft.trim());
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setEditing(false);
            }}
            style={{
              fontSize: 14,
              fontWeight: 500,
              background: "var(--bg)",
              border: "1px solid var(--accent)",
              borderRadius: 6,
              padding: "3px 8px",
              color: "var(--text)",
              outline: "none",
              minWidth: 0,
            }}
          />
        ) : (
          <button
            onClick={() => {
              setDraft(doc.name);
              setEditing(true);
            }}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 360,
            }}
          >
            {doc.name}
          </button>
        )}

        <button
          onClick={cycleStatus}
          title="Click to change status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 500,
            padding: "3px 9px",
            borderRadius: 999,
            border: "1px solid var(--border)",
            color: meta.color,
            background: "var(--bg-elev-2)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: meta.color,
            }}
          />
          {meta.label}
        </button>
      </div>

      <SaveIndicator />
      <CloudIndicator />

      <div style={{ width: 1, height: 22, background: "var(--border)", margin: "0 4px" }} />

      {/* Theme picker — grouped Light/Dark dropdown */}
      <ThemeMenu />

      <div style={{ width: 1, height: 22, background: "var(--border)", margin: "0 4px" }} />

      {!isFree && (
        <ToolButton
          icon={Share2}
          label="Share"
          onClick={() => { if (requireFeature("sharing")) setShareDialogOpen(true); }}
        />
      )}
      <ToolButton
        icon={Lock}
        label={docLocked ? "Passcode (protected)" : "Set passcode"}
        active={docLocked}
        onClick={() => { if (requireFeature("passcode")) setPasscodeDialogOpen(true); }}
      />
      <ToolButton
        icon={Info}
        label="Document info"
        onClick={() => setMetadataOpen(true)}
      />
      {!isFree && (
        <ToolButton
          icon={History}
          label="Version history"
          onClick={() => { if (requireFeature("versionHistory")) setVersionHistoryOpen(true); }}
        />
      )}
      <ToolButton
        icon={ListTree}
        label="Document outline / index"
        active={outlineOpen}
        onClick={() => setOutlineOpen(!outlineOpen)}
      />
      {!isFree && (
        <ToolButton
          icon={SpellCheck}
          label={autocorrect ? "Autocorrect: ON" : "Autocorrect: OFF"}
          active={autocorrect}
          onClick={() => { setAutocorrect(!autocorrect); showToast(`Autocorrect ${!autocorrect ? "on" : "off"}.`); }}
        />
      )}
      {!isFree && (
        <ToolButton
          icon={Bookmark}
          label="Bookmark this spot"
          onClick={() => {
            const sc = document.querySelector("[data-editor-scroll]") as HTMLElement | null;
            if (sc && doc) {
              const ratio = sc.scrollTop / Math.max(1, sc.scrollHeight - sc.clientHeight);
              setBookmark(doc.id, ratio);
              showToast("Bookmarked — you'll return here next time.");
            }
          }}
        />
      )}
      {!isFree && (
        <div style={{ position: "relative" }}>
          <ToolButton
            icon={Inbox}
            label="Edit requests"
            active={requestsOpen}
            onClick={() => setRequestsOpen(true)}
          />
          {openRequests > 0 && (
            <span
              style={{
                position: "absolute",
                top: 1,
                right: 1,
                minWidth: 15,
                height: 15,
                padding: "0 4px",
                borderRadius: 999,
                background: "var(--accent)",
                color: "var(--accent-contrast)",
                fontSize: 10,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              {openRequests}
            </span>
          )}
        </div>
      )}
      {!isFree && isAuthor && (
        <ToolButton
          icon={LayoutDashboard}
          label="Admin dashboard"
          onClick={() => { if (requireFeature("teamDashboard")) setAdminDashboardOpen(true); }}
        />
      )}
      <ExportMenu />
      <UploadButton />
      {!isFree && (
        <ToolButton
          icon={Columns2}
          label="Split view · notes, research & browser"
          active={splitView}
          onClick={toggleSplitView}
        />
      )}
      <ToolButton
        icon={SquarePen}
        label={pageBorders ? "Page border: ON" : "Show page border"}
        active={pageBorders}
        onClick={() => setPageBorders(!pageBorders)}
      />
      <ToolButton icon={Maximize2} label="Zen mode" onClick={toggleZen} />

      <div style={{ width: 1, height: 22, background: "var(--border)", margin: "0 4px" }} />

      {/* Eye-comfort: brightness slider + warm night mode */}
      <ComfortControls />

      {/* Page zoom (modern slider) */}
      <ZoomControl />

      <div style={{ width: 1, height: 22, background: "var(--border)", margin: "0 4px" }} />

      {/* AI Action button — quick-launch the AI editing suite */}
      <button
        title="Open the AI editing suite"
        aria-label="Open the AI editing suite"
        onClick={() => {
          // Doubles as the panel show/hide (the separate right-sidebar button was removed).
          if (aiPanelOpen) { toggleAIPanel(); return; }
          if (!requireFeature("aiSuite")) return;
          setAiSuiteOverride(true);
          toggleAIPanel();
          showToast("AI editing suite ready — select text to rewrite.");
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 32,
          padding: "0 12px",
          borderRadius: 999,
          fontSize: 12.5,
          fontWeight: 600,
          color: "var(--accent-contrast)",
          background: "var(--accent)",
          boxShadow: "0 2px 8px -2px var(--accent)",
        }}
      >
        <Sparkles size={15} /> AI
      </button>
      <ScreenShade />

      {requestsOpen && <RequestsPanel onClose={() => setRequestsOpen(false)} />}
    </header>
  );
}

/** Compact Supabase sync status (only shown when cloud storage is configured). */
function CloudIndicator() {
  const status = useStore((s) => s.cloudStatus);
  const error = useStore((s) => s.cloudError);
  if (!supabaseEnabled) return null;
  const map = {
    idle: { icon: Cloud, color: "var(--text-tertiary)", label: "Cloud ready" },
    syncing: { icon: RefreshCw, color: "var(--warning)", label: "Syncing to cloud…" },
    synced: { icon: Cloud, color: "var(--success)", label: "Synced to cloud" },
    error: { icon: CloudOff, color: "var(--danger)", label: error || "Cloud sync error" },
  }[status];
  const Icon = map.icon;
  return (
    <span title={map.label} style={{ display: "flex", alignItems: "center", color: map.color }}>
      <Icon size={15} className={status === "syncing" ? "saving-dot" : undefined} />
    </span>
  );
}

const PLAN_HINTS: Record<string, string[]> = {
  free: ["Distraction-free editor", "Light & dark themes", "Text & Markdown export", "Up to 3 documents"],
  pro: ["Everything in Free, unlocked", "AI editing suite + your keys", "Templates, layouts & textures", "Version history & exports"],
  team: ["Everything in Pro", "Real-time collaboration", "Sharing & the Team dashboard"],
};

/** Plan tag beside the edition switcher, with a hover popover of included basics. */
function PlanBadge() {
  const plan = useStore((s) => s.plan);
  const setOpen = useStore((s) => s.setAccountOpen);
  const [hover, setHover] = useState(false);
  const meta = PLAN_META[plan];
  return (
    <div style={{ position: "relative" }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        onClick={() => setOpen(true)}
        title="Manage plan"
        style={{
          display: "flex", alignItems: "center", gap: 5, height: 24, padding: "0 9px", borderRadius: 999,
          fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
          color: plan === "free" ? "var(--text-secondary)" : "var(--accent)",
          background: plan === "free" ? "var(--bg-elev-2)" : "var(--accent-soft)",
          border: plan === "free" ? "1px solid var(--border)" : "1px solid var(--accent)",
        }}
      >
        {meta.name}
      </button>
      {hover && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 1000, width: 210, padding: 11, borderRadius: 10, background: "var(--bg-elev-2)", border: "1px solid var(--border-strong)", boxShadow: "0 14px 36px rgba(0,0,0,0.34)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 7 }}>{meta.name} plan · {meta.price}</div>
          {(PLAN_HINTS[plan] ?? []).map((h) => (
            <div key={h} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11.5, color: "var(--text-secondary)", marginBottom: 4 }}>
              <Check size={12} style={{ color: "var(--success)", flexShrink: 0, marginTop: 2 }} /> {h}
            </div>
          ))}
          {plan === "free" && <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 6, fontWeight: 600 }}>Click to upgrade →</div>}
        </div>
      )}
    </div>
  );
}
