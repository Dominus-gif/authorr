export type DocStatus = "draft" | "review" | "published";
export type ThemeName =
  | "eclipse"
  | "light"
  | "sepia"
  | "macos"
  | "paper"
  | "glass-aurora"
  | "glass-mint"
  | "glass-sunset"
  | "glass-frost"
  // Professional palette system — 4 light, 4 dark (cognitive-ergonomic, WCAG AA)
  | "nordic-fog"
  | "earth-studio"
  | "sage-minimal"
  | "corporate-clean"
  | "obsidian-bloom"
  | "deep-marine"
  | "industrial-slate"
  | "muted-espresso";
export type SaveStatus = "idle" | "saving" | "saved" | "synced";
/** Top-left workspace context — swaps mode-specific tools, panels, and behaviors. */
export type WorkMode = "scriptwriting" | "professional" | "academic" | "casual";

/** A reference in the Academic-mode citation library (Zotero-lite). */
export interface Citation {
  id: string;
  type: "article" | "book" | "web" | "report";
  authors: string; // "Smith, J. & Doe, A."
  year: string;
  title: string;
  source: string; // journal / publisher / site
  url?: string;
}
export type Role = "author" | "co-author" | "user" | "viewer";
export type Edition = "personal" | "workspace";

export const ROLE_META: Record<
  Role,
  { label: string; desc: string; color: string }
> = {
  author: { label: "Author", desc: "Create & edit own content", color: "#7f77dd" },
  "co-author": { label: "Co-author", desc: "Collaboratively edit shared content", color: "#5dca8f" },
  user: { label: "User", desc: "View shared content", color: "#5b9ddd" },
  viewer: { label: "Thinker / Viewer", desc: "View & comment, no edits", color: "#ef9f27" },
};

export interface User {
  id: string;
  name: string;
  color: string;
  role: Role;
}

export interface DocVersion {
  id: string;
  ts: number;
  content: string; // ProseMirror HTML snapshot
  words: number;
  label?: string;
  author?: { id: string; name: string };
}

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "needs_review"
  | "approved"
  | "rejected";

export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; color: string }
> = {
  pending: { label: "Pending", color: "var(--warning)" },
  in_progress: { label: "In progress", color: "var(--accent)" },
  needs_review: { label: "Requires review", color: "var(--accent)" },
  approved: { label: "Approved", color: "var(--success)" },
  rejected: { label: "Rejected", color: "var(--danger)" },
};

/** A task is "open" until it is approved or rejected. */
export function isTaskOpen(status: TaskStatus): boolean {
  return status !== "approved" && status !== "rejected";
}

export type RequestKind = "amend" | "review";

export interface EditTask {
  id: string;
  /** Human-friendly sequential reference, shown as #1, #2… */
  ref: number;
  docId: string;
  kind: RequestKind;
  assigneeId: string;
  assigneeName: string;
  assigneeColor: string;
  requestedById: string;
  requestedByName: string;
  note: string;
  excerpt: string;
  ts: number;
  status: TaskStatus;
  /** ms the assignee has had the request (set when opened/started) */
  startedAt?: number;
  /** True once the anchored text was changed/removed, making the task invalid. */
  stale?: boolean;
  /** Who amended the underlying text that rendered the task unavailable. */
  staleBy?: string;
  staleAt?: number;
}

/** Folder/note color labels for visual categorization. */
export const NODE_COLORS: { id: string; label: string; value: string }[] = [
  { id: "none", label: "None", value: "var(--text-tertiary)" },
  { id: "violet", label: "Drafts", value: "#7f77dd" },
  { id: "amber", label: "Review", value: "#ef9f27" },
  { id: "green", label: "Final", value: "#5dca8f" },
  { id: "blue", label: "Research", value: "#5b9ddd" },
  { id: "pink", label: "Personal", value: "#d4537e" },
];

export interface Contributor {
  id: string;
  name: string;
}

/** A pending "your role changed" notice, delivered when the user next logs in. */
export interface RoleNotice {
  id: string;
  userId: string;
  fromRole: Role;
  toRole: Role;
  by: string;
  ts: number;
  delivered: boolean;
}

/** A freehand stroke on the page doodle overlay. Points are in the content
 *  column's coordinate space; `cw` records the column width at draw time so the
 *  stroke's X can be scaled proportionally when the column is resized (keeps it
 *  locked to roughly the same text instead of drifting off). */
export interface PageStroke {
  tool: "pen" | "pencil";
  color: string;
  width: number;
  points: [number, number][];
  cw?: number;
}

export type ShareVisibility = "public" | "private" | "onetime";

export const SHARE_META: Record<ShareVisibility, { label: string; desc: string }> = {
  public: { label: "Public", desc: "Anyone with the link can view" },
  private: { label: "Private", desc: "Only people you approve can view" },
  onetime: { label: "One-time view", desc: "Link works once, then expires" },
};

export interface ShareConfig {
  visibility: ShareVisibility;
  token: string;
  createdAt: number;
  /** Epoch ms when a public link auto-expires; null/absent = no expiry. */
  expiresAt?: number | null;
}

export interface AccessRequest {
  id: string;
  docId: string;
  docName: string;
  requesterName: string;
  ts: number;
  status: "pending" | "accepted" | "denied";
  /** 8-digit access ID generated on acceptance */
  accessId?: string;
}

export interface RestoreRequest {
  id: string;
  docId: string;
  docName: string;
  versionId: string;
  versionLabel: string;
  requestedById: string;
  requestedByName: string;
  ts: number;
  status: "pending" | "approved" | "rejected";
}

export interface TreeNode {
  id: string;
  type: "folder" | "doc";
  name: string;
  /** Color label id (see NODE_COLORS) for visual categorization */
  color?: string;
  /** Folders only */
  children?: TreeNode[];
  expanded?: boolean;
  /** Docs only */
  status?: DocStatus;
  content?: string; // ProseMirror HTML
  updatedAt?: number;
  /** true once the user manually renamed it — stops auto-naming */
  manualTitle?: boolean;
  /** djb2 hash of the passcode; presence means the note is locked */
  passcodeHash?: string;
  /** Collaboration mode for this doc — personal drafts vs team workspace */
  collabMode?: "personal" | "team";
  // Document metadata
  createdAt?: number;
  creatorId?: string;
  creatorName?: string;
  editCount?: number;
  contributors?: Contributor[];
}

export const STATUS_META: Record<
  DocStatus,
  { label: string; color: string }
> = {
  draft: { label: "Draft", color: "var(--text-tertiary)" },
  review: { label: "Review", color: "var(--warning)" },
  published: { label: "Published", color: "var(--success)" },
};
