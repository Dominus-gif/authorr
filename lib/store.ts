"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AccessRequest,
  DocStatus,
  DocVersion,
  Edition,
  EditTask,
  PageStroke,
  RestoreRequest,
  Role,
  RoleNotice,
  SaveStatus,
  ShareConfig,
  ShareVisibility,
  TaskStatus,
  ThemeName,
  TreeNode,
  User,
} from "./types";
import { ROLE_META } from "./types";
import { DEFAULT_FONT_ID, fontStack } from "./fonts";
import type { Plan, Feature, GridSettings } from "./plans";
import { DEFAULT_GRID, FREE_MAX_DOCS, FREE_MAX_FOLDERS, planAllows } from "./plans";

/** A user-managed AI API key (Key Management System, Pro/Team). */
export interface ApiKey {
  id: string;
  name: string;
  /** The secret. Stored locally for the prototype; real secrets need a backend vault. */
  key: string;
  createdAt: number;
}

const uid = () => Math.random().toString(36).slice(2, 10);

/** Writing-surface paper texture (per document). */
export type PaperTexture = "plain" | "lines" | "dots" | "grid";

/** Team activity-log entry (folder/file create & delete history). */
export interface ActivityEntry {
  id: string;
  action: "create" | "delete";
  nodeType: "doc" | "folder";
  name: string;
  userId: string;
  userName: string;
  at: number;
}

/** Per-folder permission: which roles may create / delete inside it. Absent =
 *  inherit from the nearest ancestor, else the default (everyone but viewer). */
export interface FolderPermission {
  create: Role[];
  delete: Role[];
}
const DEFAULT_FOLDER_PERMISSION: FolderPermission = {
  create: ["author", "co-author", "user"],
  delete: ["author", "co-author"],
};

/** Find the parent folder id of a node (null if at root). */
function parentIdOf(nodes: TreeNode[], childId: string, parent: string | null = null): string | null {
  for (const n of nodes) {
    if (n.id === childId) return parent;
    if (n.children) {
      const found = parentIdOf(n.children, childId, n.id);
      if (found !== null) return found;
    }
  }
  return null;
}

/** Count docs + folders anywhere in the tree (for Free-plan storage caps). */
function countTree(nodes: TreeNode[]): { docs: number; folders: number } {
  let docs = 0, folders = 0;
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      if (n.type === "doc") docs++;
      else { folders++; if (n.children) walk(n.children); }
    }
  };
  walk(nodes);
  return { docs, folders };
}

/** djb2 → base36; used for passcode hashing (prototype, not real crypto). */
function hashCode(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

const eightDigit = () => String(Math.floor(10000000 + Math.random() * 90000000));

/** In-app prompt/confirm config — replaces native window.prompt/confirm. */
export interface PromptConfig {
  title: string;
  message?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  multiline?: boolean;
  /** false → a confirm dialog with no text input */
  input?: boolean;
  confirmLabel?: string;
  onSubmit: (value: string) => void;
}

/* Simulated identities — stands in for real auth until the services phase. */
export const SEED_USERS: User[] = [
  { id: "u-author", name: "You (Author)", color: "#7f77dd", role: "author" },
  { id: "u-mara", name: "Mara Lin", color: "#5dca8f", role: "co-author" },
  { id: "u-deus", name: "Deus Okoro", color: "#ef9f27", role: "viewer" },
  { id: "u-ines", name: "Inés Vidal", color: "#5b9ddd", role: "user" },
];

const MAX_VERSIONS = 60;
/** Minimum gap between version snapshots (ms). */
const VERSION_INTERVAL = 25000;

/** Personal plan collaboration limits. */
export const PERSONAL_MAX_INVITES = 5;
export const PERSONAL_DAILY_COLLAB_LIMIT = 50;
const today = () => new Date().toISOString().slice(0, 10);

/* ── Recursive tree helpers (return new trees, never mutate) ── */
function mapTree(
  nodes: TreeNode[],
  fn: (n: TreeNode) => TreeNode,
): TreeNode[] {
  return nodes.map((n) => {
    const mapped = fn(n);
    if (mapped.children) {
      return { ...mapped, children: mapTree(mapped.children, fn) };
    }
    return mapped;
  });
}

function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const f = findNode(n.children, id);
      if (f) return f;
    }
  }
  return null;
}

function insertChild(
  nodes: TreeNode[],
  parentId: string | null,
  child: TreeNode,
): TreeNode[] {
  if (parentId === null) return [...nodes, child];
  return nodes.map((n) => {
    if (n.id === parentId && n.type === "folder") {
      return {
        ...n,
        expanded: true,
        children: [...(n.children ?? []), child],
      };
    }
    if (n.children) {
      return { ...n, children: insertChild(n.children, parentId, child) };
    }
    return n;
  });
}

function removeNode(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) =>
      n.children ? { ...n, children: removeNode(n.children, id) } : n,
    );
}

function firstDoc(nodes: TreeNode[]): TreeNode | null {
  for (const n of nodes) {
    if (n.type === "doc") return n;
    if (n.children) {
      const f = firstDoc(n.children);
      if (f) return f;
    }
  }
  return null;
}

/* ── Seed content ── */
const SEED_TIME = Date.UTC(2026, 5, 1, 9, 0); // 1 Jun 2026
const AUTHOR_META = {
  createdAt: SEED_TIME,
  creatorId: "u-author",
  creatorName: "You (Author)",
  contributors: [{ id: "u-author", name: "You (Author)" }],
};
const seedTree: TreeNode[] = [
  {
    id: "f-essays",
    type: "folder",
    name: "Essays",
    expanded: true,
    children: [
      {
        id: "d-finishing",
        type: "doc",
        name: "On finishing things",
        status: "draft",
        updatedAt: SEED_TIME,
        editCount: 3,
        ...AUTHOR_META,
        content:
          "<h1>On finishing things</h1><p>The hardest part of any draft is not the first sentence but the second. The cursor blinks, patient, and the room goes quiet.</p><p>Everything else fades — until you reach for the edge.</p>",
      },
      {
        id: "d-mornings",
        type: "doc",
        name: "Mornings",
        status: "review",
        updatedAt: SEED_TIME,
        editCount: 1,
        ...AUTHOR_META,
        content:
          "<h1>Mornings</h1><p>Start before the world wakes up. The page is yours and nobody is watching.</p>",
      },
    ],
  },
  {
    id: "f-clients",
    type: "folder",
    name: "Clients",
    expanded: false,
    children: [
      {
        id: "d-brief",
        type: "doc",
        name: "Acme — launch brief",
        status: "published",
        updatedAt: SEED_TIME,
        editCount: 5,
        ...AUTHOR_META,
        content: "<h1>Acme launch brief</h1><p>Positioning and key messages.</p>",
      },
    ],
  },
];

interface StoreState {
  tree: TreeNode[];
  activeDocId: string | null;
  theme: ThemeName;
  font: string;
  zen: boolean;
  sidebarOpen: boolean;
  aiPanelOpen: boolean;
  splitView: boolean;
  saveStatus: SaveStatus;
  notes: string;
  hydrated: boolean;
  versions: Record<string, DocVersion[]>;
  users: User[];
  currentUserId: string;
  editTasks: EditTask[];
  /** Monotonic counter backing each task's human-friendly #ref. */
  taskSeq: number;
  roleNotices: RoleNotice[];
  restoreRequests: RestoreRequest[];
  shares: Record<string, ShareConfig>;
  accessRequests: AccessRequest[];
  reloadNonce: number;
  lineNumbers: boolean;
  /** "Move/select" tool: shows per-block drag handles for repositioning. */
  moveMode: boolean;
  /** Page-wide doodle overlay: draw anywhere over the app. */
  doodleMode: boolean;
  pageDoodles: PageStroke[];
  // Billing plan & entitlements (Free / Pro / Team) — separate axis from edition.
  plan: Plan;
  setPlan: (plan: Plan) => void;
  /** Feature-gate upgrade modal: the locked feature, "storage" for the doc/folder
   *  cap, or null when closed. */
  gate: Feature | "storage" | null;
  /** Returns true if the plan allows the feature; otherwise opens the upgrade
   *  modal and returns false. Use to guard premium actions. */
  requireFeature: (feature: Feature) => boolean;
  closeGate: () => void;
  // AI API keys (Key Management System). activeApiKeyId null = use the app default key.
  apiKeys: ApiKey[];
  activeApiKeyId: string | null;
  addApiKey: (name: string, key: string) => void;
  deleteApiKey: (id: string) => void;
  renameApiKey: (id: string, name: string) => void;
  setActiveApiKey: (id: string | null) => void;
  // Focus timer (Pro/Team) — ephemeral floating widget toggle.
  timerOpen: boolean;
  setTimerOpen: (open: boolean) => void;
  /** Which sidebar workspace tab is active — documents are separated into
   *  Personal vs Team by their `collabMode`. */
  sidebarWorkspace: "personal" | "team";
  setSidebarWorkspace: (w: "personal" | "team") => void;
  /** Link editor dialog (custom display text + URL). */
  linkDialogOpen: boolean;
  setLinkDialogOpen: (open: boolean) => void;
  // Cloud document sync (Supabase). Ephemeral — not persisted.
  cloudStatus: "idle" | "syncing" | "synced" | "error";
  cloudError: string | null;
  lastCloudSyncAt: number | null;
  setCloudStatus: (status: "idle" | "syncing" | "synced" | "error", error?: string | null) => void;
  /** Merge cloud documents into the tree (adds any whose id isn't already present). */
  mergeCloudDocs: (nodes: TreeNode[]) => void;
  // Canvas grid / texture customization (Pro).
  grid: GridSettings;
  setGrid: (patch: Partial<GridSettings>) => void;
  /** Custom page margin in px (Pro). 0 = theme default. */
  pageMargin: number;
  setPageMargin: (px: number) => void;
  // Team workspace: activity log + per-folder permission hierarchy.
  activityLog: ActivityEntry[];
  folderPermissions: Record<string, FolderPermission>;
  setFolderPermission: (folderId: string, perm: FolderPermission) => void;
  /** Effective permission for a folder (walks up the tree to the nearest set one). */
  folderPermissionFor: (folderId: string | null) => FolderPermission;
  // Editions / collaboration / security
  edition: Edition;
  collabUnlocked: boolean;
  generatedInvite: string | null;
  autoLockMinutes: number;
  personalTeamCount: number;
  collabEdits: { date: string; count: number };
  // Resizable panel widths
  sidebarWidth: number;
  aiPanelWidth: number;
  notesWidth: number;
  // Ephemeral UI (not persisted)
  toast: string | null;
  versionHistoryOpen: boolean;
  assignRequest: { from: number; to: number; excerpt: string; kind: "amend" | "review" } | null;
  openTaskId: string | null;
  metadataOpen: boolean;
  upgradePrompt: string | null;
  collabDialogOpen: boolean;
  unlockedDocs: string[];
  passcodeDialogOpen: boolean;
  promptDialog: PromptConfig | null;
  shareDialogOpen: boolean;
  findReplaceOpen: boolean;
  adminDashboardOpen: boolean;
  symbolPickerOpen: boolean;
  translateOpen: boolean;
  browserOpen: boolean;
  cloudDialogOpen: boolean;
  embedDialogOpen: boolean;
  outlineOpen: boolean;
  /** Top-left workspace context (swaps mode-specific tools/panels). */
  workMode: import("./types").WorkMode;
  /** Editor page zoom (0.5–2.0). */
  zoom: number;
  /** Show a paper-page border/shadow around the writing column. */
  pageBorders: boolean;
  /** Per-document page/canvas fill color (Paint bucket), keyed by doc id.
   *  Absent = theme default. Setter targets the active doc only. */
  pageColors: Record<string, string>;
  setPageColor: (color: string | null) => void;
  /** Per-document paper texture (plain / ruled lines / dotted grid / graph),
   *  keyed by doc id. Absent = plain. Setter targets the active doc only. */
  paperTextures: Record<string, PaperTexture>;
  setPaperTexture: (texture: PaperTexture) => void;
  /** Favorited template ids (Templates dialog). */
  favoriteTemplates: string[];
  toggleFavoriteTemplate: (id: string) => void;
  /** Eye-comfort: interface brightness (0.55–1) + warm-light night mode. */
  brightness: number;
  setBrightness: (brightness: number) => void;
  nightMode: boolean;
  setNightMode: (nightMode: boolean) => void;
  /** Full-width "infinite canvas" vs the centered focus column. */
  infiniteCanvas: boolean;
  /** Page size for the page-break/print layout. */
  pageSize: import("./pageSizes").PageSizeId;
  /** Deleted docs/folders kept for 30 days (with their version history). */
  trash: { node: TreeNode; deletedAt: number; versions: DocVersion[] }[];
  trashOpen: boolean;
  archiveOpen: boolean;
  accountOpen: boolean;
  templatesOpen: boolean;
  /** Scriptwriting: auto-number scene headings. */
  sceneNumbers: boolean;
  /** Force the AI editing suite panel regardless of mode (in-panel toggle). */
  aiSuiteOverride: boolean;
  /** Text autocorrect on/off (top-bar toggle). */
  autocorrect: boolean;
  /** Academic corkboard view + citation library. */
  corkboardOpen: boolean;
  citationsOpen: boolean;
  citations: import("./types").Citation[];
  /** Scriptwriting side panel (dialogue tuner / reports / autocomplete). */
  scriptPanelOpen: boolean;
  /** Per-doc saved scroll position (0..1) restored on next open. */
  bookmarks: Record<string, number>;
  /** Simulated cloud-storage connections (provider ids). */
  connectedClouds: string[];
  autosaveEnabled: boolean;
  autosaveMinutes: number;

  setActiveDoc: (id: string) => void;
  updateDocContent: (id: string, content: string) => void;
  renameNode: (id: string, name: string) => void;
  autoTitle: (id: string, firstLine: string) => void;
  setStatus: (id: string, status: DocStatus) => void;
  toggleFolder: (id: string) => void;
  addDoc: (parentId: string | null) => void;
  addFolder: (parentId: string | null) => void;
  importDoc: (node: TreeNode) => void;
  deleteNode: (id: string) => void;
  setNodeColor: (id: string, color: string) => void;

  pushVersion: (docId: string, content: string, words: number, force?: boolean) => void;
  restoreVersion: (docId: string, versionId: string) => string | null;
  requestRestore: (docId: string, versionId: string, versionLabel: string) => void;
  resolveRestoreRequest: (id: string, approve: boolean) => void;
  requestReload: () => void;

  setCurrentUser: (id: string) => void;
  setUserRole: (userId: string, role: Role) => void;
  addEditTask: (task: Omit<EditTask, "id" | "ts" | "status" | "ref">) => string;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  markTaskStale: (id: string, by: string) => void;
  toggleLineNumbers: () => void;
  toggleMoveMode: () => void;
  toggleDoodleMode: () => void;
  addPageDoodle: (stroke: PageStroke) => void;
  undoPageDoodle: () => void;
  clearPageDoodles: () => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
  setVersionHistoryOpen: (open: boolean) => void;
  setAssignRequest: (req: { from: number; to: number; excerpt: string; kind: "amend" | "review" } | null) => void;
  setOpenTask: (id: string | null) => void;
  setMetadataOpen: (open: boolean) => void;
  // Editions / collaboration
  setEdition: (e: Edition) => void;
  generateInvite: () => string;
  acceptInvite: (code: string) => "ok" | "invalid" | "limit";
  setUpgradePrompt: (msg: string | null) => void;
  setCollabDialogOpen: (open: boolean) => void;
  openPrompt: (cfg: PromptConfig) => void;
  closePrompt: () => void;
  setShareDialogOpen: (open: boolean) => void;
  setFindReplaceOpen: (open: boolean) => void;
  setAdminDashboardOpen: (open: boolean) => void;
  setSymbolPickerOpen: (open: boolean) => void;
  setTranslateOpen: (open: boolean) => void;
  setBrowserOpen: (open: boolean) => void;
  setCloudDialogOpen: (open: boolean) => void;
  setEmbedDialogOpen: (open: boolean) => void;
  setOutlineOpen: (open: boolean) => void;
  setWorkMode: (mode: import("./types").WorkMode) => void;
  setZoom: (z: number) => void;
  setPageBorders: (on: boolean) => void;
  setSceneNumbers: (on: boolean) => void;
  setInfiniteCanvas: (on: boolean) => void;
  setPageSize: (s: import("./pageSizes").PageSizeId) => void;
  setTrashOpen: (open: boolean) => void;
  setArchiveOpen: (open: boolean) => void;
  setAccountOpen: (open: boolean) => void;
  setTemplatesOpen: (open: boolean) => void;
  restoreFromTrash: (nodeId: string) => void;
  permanentDelete: (nodeId: string) => void;
  createFromTemplate: (name: string, html: string) => void;
  setAiSuiteOverride: (on: boolean) => void;
  setAutocorrect: (on: boolean) => void;
  setCorkboardOpen: (open: boolean) => void;
  setCitationsOpen: (open: boolean) => void;
  addCitation: (c: Omit<import("./types").Citation, "id">) => import("./types").Citation;
  removeCitation: (id: string) => void;
  setScriptPanelOpen: (open: boolean) => void;
  setBookmark: (docId: string, ratio: number) => void;
  toggleCloud: (provider: string) => void;
  /** Simulated import of a folder from a connected cloud provider. */
  importCloudFolder: (providerId: string, label: string, folderName: string) => void;
  setAutosave: (enabled: boolean, minutes?: number) => void;
  setShare: (docId: string, visibility: ShareVisibility) => ShareConfig;
  setShareExpiry: (docId: string, ms: number | null) => void;
  requestAccess: (docId: string, requesterName: string) => void;
  resolveAccessRequest: (id: string, accept: boolean) => void;
  setCollabMode: (docId: string, mode: "personal" | "team") => void;
  recordCollabEdit: () => void;
  setPanelWidth: (panel: "sidebar" | "ai" | "notes", width: number) => void;
  // Security
  setPasscode: (docId: string, code: string) => void;
  clearPasscode: (docId: string) => void;
  unlockDoc: (docId: string, code: string) => boolean;
  lockDoc: (docId: string) => void;
  lockAll: () => void;
  setAutoLockMinutes: (m: number) => void;
  setPasscodeDialogOpen: (open: boolean) => void;

  setTheme: (t: ThemeName) => void;
  setFont: (id: string) => void;
  toggleZen: () => void;
  toggleSidebar: () => void;
  toggleAIPanel: () => void;
  toggleSplitView: () => void;
  setSaveStatus: (s: SaveStatus) => void;
  setNotes: (v: string) => void;
  setHydrated: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      tree: seedTree,
      activeDocId: "d-finishing",
      theme: "eclipse",
      font: DEFAULT_FONT_ID,
      zen: false,
      sidebarOpen: true,
      aiPanelOpen: true,
      splitView: false,
      saveStatus: "saved",
      notes: "",
      hydrated: false,
      versions: {},
      users: SEED_USERS,
      currentUserId: "u-author",
      editTasks: [],
      taskSeq: 0,
      roleNotices: [],
      restoreRequests: [],
      reloadNonce: 0,
      lineNumbers: false,
      moveMode: false,
      doodleMode: false,
      pageDoodles: [],
      edition: "personal",
      collabUnlocked: false,
      generatedInvite: null,
      autoLockMinutes: 3,
      personalTeamCount: 0,
      collabEdits: { date: today(), count: 0 },
      sidebarWidth: 256,
      aiPanelWidth: 300,
      notesWidth: 340,
      toast: null,
      versionHistoryOpen: false,
      assignRequest: null,
      openTaskId: null,
      metadataOpen: false,
      upgradePrompt: null,
      collabDialogOpen: false,
      unlockedDocs: [],
      passcodeDialogOpen: false,
      promptDialog: null,
      shareDialogOpen: false,
      findReplaceOpen: false,
      adminDashboardOpen: false,
      symbolPickerOpen: false,
      translateOpen: false,
      browserOpen: false,
      cloudDialogOpen: false,
      embedDialogOpen: false,
      outlineOpen: false,
      workMode: "professional",
      zoom: 1,
      pageBorders: true,
      pageColors: {},
      paperTextures: {},
      plan: "free",
      gate: null,
      apiKeys: [],
      activeApiKeyId: null,
      grid: { ...DEFAULT_GRID },
      pageMargin: 0,
      timerOpen: false,
      sidebarWorkspace: "personal",
      linkDialogOpen: false,
      cloudStatus: "idle",
      cloudError: null,
      lastCloudSyncAt: null,
      activityLog: [],
      folderPermissions: {},
      favoriteTemplates: [],
      brightness: 1,
      nightMode: false,
      sceneNumbers: false,
      infiniteCanvas: false,
      pageSize: "letter",
      trash: [],
      trashOpen: false,
      archiveOpen: false,
      accountOpen: false,
      templatesOpen: false,
      aiSuiteOverride: false,
      autocorrect: true,
      corkboardOpen: false,
      citationsOpen: false,
      citations: [],
      scriptPanelOpen: false,
      bookmarks: {},
      connectedClouds: [],
      autosaveEnabled: false,
      autosaveMinutes: 2,
      shares: {},
      accessRequests: [],

      setActiveDoc: (id) => set({ activeDocId: id }),

      updateDocContent: (id, content) =>
        set((s) => {
          const me = s.users.find((u) => u.id === s.currentUserId);
          return {
            tree: mapTree(s.tree, (n) => {
              if (n.id !== id) return n;
              const contributors = n.contributors ? [...n.contributors] : [];
              if (me && !contributors.some((c) => c.id === me.id))
                contributors.push({ id: me.id, name: me.name });
              return {
                ...n,
                content,
                updatedAt: Date.now(),
                editCount: (n.editCount ?? 0) + 1,
                contributors,
              };
            }),
          };
        }),

      renameNode: (id, name) =>
        set((s) => ({
          tree: mapTree(s.tree, (n) =>
            n.id === id ? { ...n, name, manualTitle: true } : n,
          ),
        })),

      autoTitle: (id, firstLine) =>
        set((s) => {
          const title = firstLine.trim().replace(/\s+/g, " ").slice(0, 80);
          if (!title) return {};
          return {
            tree: mapTree(s.tree, (n) =>
              n.id === id && n.type === "doc" && !n.manualTitle && n.name !== title
                ? { ...n, name: title }
                : n,
            ),
          };
        }),

      setStatus: (id, status) =>
        set((s) => ({
          tree: mapTree(s.tree, (n) => (n.id === id ? { ...n, status } : n)),
        })),

      toggleFolder: (id) =>
        set((s) => ({
          tree: mapTree(s.tree, (n) =>
            n.id === id ? { ...n, expanded: !n.expanded } : n,
          ),
        })),

      addDoc: (parentId) => {
        // Free plan: cap total documents.
        const st = get();
        if (st.plan === "free" && countTree(st.tree).docs >= FREE_MAX_DOCS) {
          set({ gate: "storage" });
          st.showToast(`Free plan is limited to ${FREE_MAX_DOCS} documents.`);
          return;
        }
        const me = st.users.find((u) => u.id === st.currentUserId);
        // Team permission: who may create inside this folder (author always may).
        const perm = st.folderPermissionFor(parentId);
        if (me && me.role !== "author" && !perm.create.includes(me.role)) {
          st.showToast("You don't have permission to create files here.");
          return;
        }
        const id = "d-" + uid();
        const now = Date.now();
        const doc: TreeNode = {
          id,
          type: "doc",
          name: "Untitled",
          status: "draft",
          updatedAt: now,
          content: "<h1>Untitled</h1><p></p>",
          createdAt: now,
          creatorId: me?.id,
          creatorName: me?.name,
          editCount: 0,
          contributors: me ? [{ id: me.id, name: me.name }] : [],
          // Root-level docs belong to the active sidebar workspace (Personal/Team).
          collabMode: parentId ? undefined : st.sidebarWorkspace,
        };
        set((s) => ({
          tree: insertChild(s.tree, parentId, doc),
          activeDocId: id,
          activityLog: [{ id: "a-" + uid(), action: "create" as const, nodeType: "doc" as const, name: doc.name, userId: me?.id ?? "", userName: me?.name ?? "Someone", at: now }, ...s.activityLog].slice(0, 200),
        }));
      },

      addFolder: (parentId) => {
        // Free plan: cap total folders.
        const st = get();
        if (st.plan === "free" && countTree(st.tree).folders >= FREE_MAX_FOLDERS) {
          set({ gate: "storage" });
          st.showToast(`Free plan is limited to ${FREE_MAX_FOLDERS} folder.`);
          return;
        }
        const me = st.users.find((u) => u.id === st.currentUserId);
        const perm = st.folderPermissionFor(parentId);
        if (me && me.role !== "author" && !perm.create.includes(me.role)) {
          st.showToast("You don't have permission to create folders here.");
          return;
        }
        const folder: TreeNode = {
          id: "f-" + uid(),
          type: "folder",
          name: "New folder",
          expanded: true,
          children: [],
          collabMode: parentId ? undefined : st.sidebarWorkspace,
        };
        set((s) => ({
          tree: insertChild(s.tree, parentId, folder),
          activityLog: [{ id: "a-" + uid(), action: "create" as const, nodeType: "folder" as const, name: folder.name, userId: me?.id ?? "", userName: me?.name ?? "Someone", at: Date.now() }, ...s.activityLog].slice(0, 200),
        }));
      },

      importDoc: (node) => {
        set((s) => ({
          tree: [...s.tree, node],
          activeDocId: node.id,
        }));
      },

      deleteNode: (id) => {
        const st = get();
        const me = st.users.find((u) => u.id === st.currentUserId);
        // Team permission: who may delete from the containing folder (author always may).
        const perm = st.folderPermissionFor(parentIdOf(st.tree, id));
        if (me && me.role !== "author" && !perm.delete.includes(me.role)) {
          st.showToast("You don't have permission to delete here.");
          return;
        }
        set((s) => {
          const node = findNode(s.tree, id);
          const tree = removeNode(s.tree, id);
          let activeDocId = s.activeDocId;
          if (activeDocId && !findNode(tree, activeDocId)) {
            activeDocId = firstDoc(tree)?.id ?? null;
          }
          const versions = { ...s.versions };
          const removedVersions = versions[id] ?? [];
          delete versions[id];
          // Keep deleted items in Trash for 30 days (with their version history);
          // drop anything already older than that.
          const cutoff = Date.now() - 30 * 86400000;
          const trash = node
            ? [{ node, deletedAt: Date.now(), versions: removedVersions }, ...s.trash.filter((t) => t.deletedAt >= cutoff)]
            : s.trash.filter((t) => t.deletedAt >= cutoff);
          const activityLog = node
            ? [{ id: "a-" + uid(), action: "delete" as const, nodeType: node.type === "folder" ? "folder" as const : "doc" as const, name: node.name, userId: me?.id ?? "", userName: me?.name ?? "Someone", at: Date.now() }, ...s.activityLog].slice(0, 200)
            : s.activityLog;
          return { tree, activeDocId, versions, trash, activityLog };
        });
      },

      restoreFromTrash: (nodeId) =>
        set((s) => {
          const item = s.trash.find((t) => t.node.id === nodeId);
          if (!item) return {};
          return {
            tree: [...s.tree, item.node],
            versions: item.versions.length ? { ...s.versions, [nodeId]: item.versions } : s.versions,
            trash: s.trash.filter((t) => t.node.id !== nodeId),
            activeDocId: item.node.type === "doc" ? nodeId : s.activeDocId,
          };
        }),

      permanentDelete: (nodeId) => set((s) => ({ trash: s.trash.filter((t) => t.node.id !== nodeId) })),

      createFromTemplate: (name, html) => {
        const id = "d-" + uid();
        const me = get().users.find((u) => u.id === get().currentUserId);
        const now = Date.now();
        const doc: TreeNode = {
          id, type: "doc", name, status: "draft", updatedAt: now, content: html,
          createdAt: now, creatorId: me?.id, creatorName: me?.name, editCount: 0,
          contributors: me ? [{ id: me.id, name: me.name }] : [], manualTitle: true,
        };
        set((s) => ({ tree: [...s.tree, doc], activeDocId: id, templatesOpen: false }));
      },

      setInfiniteCanvas: (infiniteCanvas) => set({ infiniteCanvas }),
      setPageSize: (pageSize) => set({ pageSize }),
      setTrashOpen: (trashOpen) => set({ trashOpen }),
      setArchiveOpen: (archiveOpen) => set({ archiveOpen }),
      setAccountOpen: (accountOpen) => set({ accountOpen }),
      setTemplatesOpen: (templatesOpen) => set({ templatesOpen }),

      setNodeColor: (id, color) =>
        set((s) => ({
          tree: mapTree(s.tree, (n) => (n.id === id ? { ...n, color } : n)),
        })),

      pushVersion: (docId, content, words, force = false) =>
        set((s) => {
          const me = s.users.find((u) => u.id === s.currentUserId);
          const author = me ? { id: me.id, name: me.name } : undefined;
          const list = s.versions[docId] ?? [];
          const last = list[0];
          if (last && last.content === content) return {};
          if (
            !force &&
            last &&
            last.author?.id === author?.id &&
            Date.now() - last.ts < VERSION_INTERVAL
          ) {
            // Update the most recent snapshot in place (coalesce rapid edits
            // from the same author).
            const updated = [{ ...last, content, words, ts: Date.now(), author }, ...list.slice(1)];
            return { versions: { ...s.versions, [docId]: updated } };
          }
          const version: DocVersion = {
            id: "v-" + uid(),
            ts: Date.now(),
            content,
            words,
            author,
          };
          return {
            versions: {
              ...s.versions,
              [docId]: [version, ...list].slice(0, MAX_VERSIONS),
            },
          };
        }),

      restoreVersion: (docId, versionId) => {
        const list = get().versions[docId] ?? [];
        const v = list.find((x) => x.id === versionId);
        if (!v) return null;
        // Snapshot current state before restoring, then apply.
        const current = findNode(get().tree, docId);
        if (current?.content) {
          get().pushVersion(
            docId,
            current.content,
            current.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length,
            true,
          );
        }
        set((s) => ({
          tree: mapTree(s.tree, (n) =>
            n.id === docId ? { ...n, content: v.content, updatedAt: Date.now() } : n,
          ),
        }));
        return v.content;
      },

      requestRestore: (docId, versionId, versionLabel) => {
        const me = get().users.find((u) => u.id === get().currentUserId);
        const doc = findNode(get().tree, docId);
        set((s) => ({
          restoreRequests: [
            {
              id: "r-" + uid(),
              docId,
              docName: doc?.name ?? "Document",
              versionId,
              versionLabel,
              requestedById: me?.id ?? "",
              requestedByName: me?.name ?? "User",
              ts: Date.now(),
              status: "pending",
            },
            ...s.restoreRequests,
          ],
        }));
      },

      resolveRestoreRequest: (id, approve) => {
        const req = get().restoreRequests.find((r) => r.id === id);
        set((s) => ({
          restoreRequests: s.restoreRequests.map((r) =>
            r.id === id ? { ...r, status: approve ? "approved" : "rejected" } : r,
          ),
        }));
        if (approve && req) {
          get().restoreVersion(req.docId, req.versionId);
          if (get().activeDocId === req.docId) get().requestReload();
        }
      },

      requestReload: () => set((s) => ({ reloadNonce: s.reloadNonce + 1 })),

      setTheme: (theme) => {
        if (typeof document !== "undefined")
          document.documentElement.setAttribute("data-theme", theme);
        set({ theme });
      },
      setFont: (font) => {
        if (typeof document !== "undefined")
          document.documentElement.style.setProperty(
            "--font-reading",
            fontStack(font),
          );
        set({ font });
      },
      toggleZen: () => set((s) => ({ zen: !s.zen })),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleAIPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
      toggleSplitView: () => set((s) => ({ splitView: !s.splitView })),
      setSaveStatus: (saveStatus) => set({ saveStatus }),
      setNotes: (notes) => set({ notes }),
      setHydrated: () => set({ hydrated: true }),

      setCurrentUser: (currentUserId) => {
        set({ currentUserId });
        // Deliver any pending role-change notices to this user "on login".
        const pending = get().roleNotices.filter((n) => n.userId === currentUserId && !n.delivered);
        if (pending.length) {
          const latest = pending[pending.length - 1];
          const meta = ROLE_META[latest.toRole];
          set((s) => ({
            roleNotices: s.roleNotices.map((n) => (n.userId === currentUserId ? { ...n, delivered: true } : n)),
            toast: `${latest.by} changed your role to ${meta.label}.`,
          }));
        }
      },
      setUserRole: (userId, role) =>
        set((s) => {
          const target = s.users.find((u) => u.id === userId);
          if (!target || target.role === role) return {};
          const by = s.users.find((u) => u.id === s.currentUserId)?.name ?? "An admin";
          const notice: RoleNotice = {
            id: "rn-" + uid(),
            userId,
            fromRole: target.role,
            toRole: role,
            by,
            ts: Date.now(),
            delivered: userId === s.currentUserId, // immediate if changing self
          };
          return {
            users: s.users.map((u) => (u.id === userId ? { ...u, role } : u)),
            roleNotices: [...s.roleNotices, notice],
            toast: userId === s.currentUserId ? `Your role is now ${ROLE_META[role].label}.` : `${target.name}'s role changed to ${ROLE_META[role].label}.`,
          };
        }),
      addEditTask: (task) => {
        const id = "t-" + uid();
        set((s) => {
          const ref = s.taskSeq + 1;
          return {
            taskSeq: ref,
            editTasks: [
              { ...task, id, ref, ts: Date.now(), status: "pending" as TaskStatus },
              ...s.editTasks,
            ],
          };
        });
        return id;
      },
      setTaskStatus: (id, status) =>
        set((s) => ({
          editTasks: s.editTasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  startedAt:
                    status === "in_progress" && !t.startedAt ? Date.now() : t.startedAt,
                }
              : t,
          ),
        })),
      markTaskStale: (id, by) =>
        set((s) => ({
          editTasks: s.editTasks.map((t) =>
            t.id === id && !t.stale ? { ...t, stale: true, staleBy: by, staleAt: Date.now() } : t,
          ),
        })),
      toggleLineNumbers: () => set((s) => ({ lineNumbers: !s.lineNumbers })),
      toggleMoveMode: () => set((s) => ({ moveMode: !s.moveMode })),
      toggleDoodleMode: () => set((s) => ({ doodleMode: !s.doodleMode })),
      addPageDoodle: (stroke) => set((s) => ({ pageDoodles: [...s.pageDoodles, stroke] })),
      undoPageDoodle: () => set((s) => ({ pageDoodles: s.pageDoodles.slice(0, -1) })),
      clearPageDoodles: () => set({ pageDoodles: [] }),
      showToast: (toast) => set({ toast }),
      clearToast: () => set({ toast: null }),
      setVersionHistoryOpen: (versionHistoryOpen) => set({ versionHistoryOpen }),
      setAssignRequest: (assignRequest) => set({ assignRequest }),
      setOpenTask: (openTaskId) => set({ openTaskId }),
      setMetadataOpen: (metadataOpen) => set({ metadataOpen }),

      setEdition: (edition) =>
        set({ edition, collabUnlocked: edition === "workspace" ? true : get().collabUnlocked }),
      generateInvite: () => {
        const code = Array.from({ length: 8 }, () =>
          "ABCDEFGHJKMNPQRSTUVWXYZ23456789".charAt(Math.floor(Math.random() * 30)),
        ).join("");
        set({ generatedInvite: code });
        return code;
      },
      acceptInvite: (code) => {
        const valid = code.trim().toUpperCase() === (get().generatedInvite ?? "");
        if (!valid) return "invalid";
        if (get().edition === "personal" && get().personalTeamCount >= PERSONAL_MAX_INVITES) {
          return "limit";
        }
        set((s) => ({
          collabUnlocked: true,
          personalTeamCount: Math.min(PERSONAL_MAX_INVITES, s.personalTeamCount + 1),
        }));
        return "ok";
      },
      setUpgradePrompt: (upgradePrompt) => set({ upgradePrompt }),
      setCollabDialogOpen: (collabDialogOpen) => set({ collabDialogOpen }),
      openPrompt: (promptDialog) => set({ promptDialog }),
      closePrompt: () => set({ promptDialog: null }),
      setShareDialogOpen: (shareDialogOpen) => set({ shareDialogOpen }),
      setFindReplaceOpen: (findReplaceOpen) => set({ findReplaceOpen }),
      setAdminDashboardOpen: (adminDashboardOpen) => set({ adminDashboardOpen }),
      setSymbolPickerOpen: (symbolPickerOpen) => set({ symbolPickerOpen }),
      setTranslateOpen: (translateOpen) => set({ translateOpen }),
      setBrowserOpen: (browserOpen) => set({ browserOpen }),
      setCloudDialogOpen: (cloudDialogOpen) => set({ cloudDialogOpen }),
      setEmbedDialogOpen: (embedDialogOpen) => set({ embedDialogOpen }),
      setOutlineOpen: (outlineOpen) => set({ outlineOpen }),
      setWorkMode: (workMode) => set({ workMode }),
      setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, Math.round(zoom * 100) / 100)) }),
      setPageBorders: (pageBorders) => set({ pageBorders }),
      setPageColor: (color) => set((s) => {
        const id = s.activeDocId;
        if (!id) return {};
        const next = { ...s.pageColors };
        if (color) next[id] = color; else delete next[id];
        return { pageColors: next };
      }),
      setPaperTexture: (texture) => set((s) => {
        const id = s.activeDocId;
        if (!id) return {};
        const next = { ...s.paperTextures };
        if (texture === "plain") delete next[id]; else next[id] = texture;
        return { paperTextures: next };
      }),
      setPlan: (plan) =>
        // The Team plan is inherently a shared workspace: force the Workspace
        // edition + unlock collaboration, and (in EditionMenu) lock switching back.
        set(plan === "team" ? { plan, edition: "workspace", collabUnlocked: true } : { plan }),
      requireFeature: (feature) => {
        if (planAllows(get().plan, feature)) return true;
        set({ gate: feature });
        return false;
      },
      closeGate: () => set({ gate: null }),
      addApiKey: (name, key) => set((s) => {
        const k: ApiKey = { id: "k-" + uid(), name: name.trim() || "API key", key: key.trim(), createdAt: Date.now() };
        return { apiKeys: [...s.apiKeys, k], activeApiKeyId: s.activeApiKeyId ?? k.id };
      }),
      deleteApiKey: (id) => set((s) => ({
        apiKeys: s.apiKeys.filter((k) => k.id !== id),
        activeApiKeyId: s.activeApiKeyId === id ? null : s.activeApiKeyId,
      })),
      renameApiKey: (id, name) => set((s) => ({
        apiKeys: s.apiKeys.map((k) => (k.id === id ? { ...k, name: name.trim() || k.name } : k)),
      })),
      setActiveApiKey: (id) => set({ activeApiKeyId: id }),
      setGrid: (patch) => set((s) => ({ grid: { ...s.grid, ...patch } })),
      setTimerOpen: (timerOpen) => set({ timerOpen }),
      setSidebarWorkspace: (sidebarWorkspace) => set({ sidebarWorkspace }),
      setLinkDialogOpen: (linkDialogOpen) => set({ linkDialogOpen }),
      setCloudStatus: (cloudStatus, cloudError = null) =>
        set({ cloudStatus, cloudError, lastCloudSyncAt: cloudStatus === "synced" ? Date.now() : get().lastCloudSyncAt }),
      mergeCloudDocs: (nodes) => set((s) => {
        const fresh = nodes.filter((n) => !findNode(s.tree, n.id));
        if (fresh.length === 0) return {};
        return { tree: [...s.tree, ...fresh], activeDocId: s.activeDocId ?? fresh[0]?.id ?? null };
      }),
      setPageMargin: (pageMargin) => set({ pageMargin: Math.max(0, Math.min(160, Math.round(pageMargin))) }),
      setFolderPermission: (folderId, perm) =>
        set((s) => ({ folderPermissions: { ...s.folderPermissions, [folderId]: perm } })),
      folderPermissionFor: (folderId) => {
        const s = get();
        let id: string | null = folderId;
        const seen = new Set<string>();
        while (id && !seen.has(id)) {
          seen.add(id);
          if (s.folderPermissions[id]) return s.folderPermissions[id];
          id = parentIdOf(s.tree, id);
        }
        return DEFAULT_FOLDER_PERMISSION;
      },
      toggleFavoriteTemplate: (id) => set((s) => ({
        favoriteTemplates: s.favoriteTemplates.includes(id)
          ? s.favoriteTemplates.filter((x) => x !== id)
          : [...s.favoriteTemplates, id],
      })),
      setBrightness: (brightness) => set({ brightness }),
      setNightMode: (nightMode) => set({ nightMode }),
      setSceneNumbers: (sceneNumbers) => set({ sceneNumbers }),
      setAiSuiteOverride: (aiSuiteOverride) => set({ aiSuiteOverride }),
      setAutocorrect: (autocorrect) => set({ autocorrect }),
      setCorkboardOpen: (corkboardOpen) => set({ corkboardOpen }),
      setCitationsOpen: (citationsOpen) => set({ citationsOpen }),
      addCitation: (c) => {
        const cit = { ...c, id: "cite-" + Math.random().toString(36).slice(2, 9) };
        set((s) => ({ citations: [...s.citations, cit] }));
        return cit;
      },
      removeCitation: (id) => set((s) => ({ citations: s.citations.filter((c) => c.id !== id) })),
      setScriptPanelOpen: (scriptPanelOpen) => set({ scriptPanelOpen }),
      setBookmark: (docId, ratio) => set((s) => ({ bookmarks: { ...s.bookmarks, [docId]: ratio } })),
      toggleCloud: (provider) =>
        set((s) => {
          const isOn = s.connectedClouds.includes(provider);
          return {
            connectedClouds: isOn
              ? s.connectedClouds.filter((p) => p !== provider)
              : [...s.connectedClouds, provider],
            // Disconnecting removes that provider's imported folders.
            tree: isOn ? s.tree.filter((n) => n.cloudProvider !== provider) : s.tree,
          };
        }),
      importCloudFolder: (providerId, label, folderName) =>
        set((s) => {
          const now = Date.now();
          const folder: TreeNode = {
            id: "f-" + uid(),
            type: "folder",
            name: folderName,
            expanded: true,
            collabMode: "personal",
            cloudProvider: providerId,
            children: [
              { id: "d-" + uid(), type: "doc", name: "Welcome.ef", status: "draft", content: `<h1>${folderName}</h1><p>Imported from ${label}.</p>`, createdAt: now, updatedAt: now },
              { id: "d-" + uid(), type: "doc", name: "Shared notes", status: "draft", content: "<h1>Shared notes</h1><p></p>", createdAt: now, updatedAt: now },
            ],
          };
          return {
            tree: [...s.tree, folder],
            sidebarWorkspace: "personal",
            activityLog: [{ id: "a-" + uid(), action: "create" as const, nodeType: "folder" as const, name: `${folderName} (${label})`, userId: s.currentUserId, userName: s.users.find((u) => u.id === s.currentUserId)?.name ?? "You", at: now }, ...s.activityLog].slice(0, 200),
          };
        }),
      setAutosave: (autosaveEnabled, minutes) =>
        set((s) => ({ autosaveEnabled, autosaveMinutes: minutes ?? s.autosaveMinutes })),
      setShare: (docId, visibility) => {
        const existing = get().shares[docId];
        const cfg: ShareConfig = {
          visibility,
          token: existing?.token ?? uid() + uid(),
          createdAt: existing?.createdAt ?? Date.now(),
          expiresAt: existing?.expiresAt ?? null,
        };
        set((s) => ({ shares: { ...s.shares, [docId]: cfg } }));
        return cfg;
      },
      setShareExpiry: (docId, ms) =>
        set((s) => {
          const existing = s.shares[docId];
          if (!existing) return {};
          return { shares: { ...s.shares, [docId]: { ...existing, expiresAt: ms === null ? null : Date.now() + ms } } };
        }),
      requestAccess: (docId, requesterName) => {
        const doc = findNode(get().tree, docId);
        set((s) => ({
          accessRequests: [
            {
              id: "ar-" + uid(),
              docId,
              docName: doc?.name ?? "Shared note",
              requesterName,
              ts: Date.now(),
              status: "pending",
            },
            ...s.accessRequests,
          ],
        }));
        get().showToast(`${requesterName} requested edit access — see your inbox.`);
      },
      resolveAccessRequest: (id, accept) => {
        const code = eightDigit();
        const req = get().accessRequests.find((r) => r.id === id);
        set((s) => ({
          accessRequests: s.accessRequests.map((r) =>
            r.id === id
              ? { ...r, status: accept ? "accepted" : "denied", accessId: accept ? code : undefined }
              : r,
          ),
        }));
        if (req) {
          get().showToast(
            accept
              ? `Access granted to ${req.requesterName} — ID ${code} (this doc + user only).`
              : `Access denied for ${req.requesterName}.`,
          );
        }
      },
      setCollabMode: (docId, mode) =>
        set((s) => ({
          tree: mapTree(s.tree, (n) => (n.id === docId ? { ...n, collabMode: mode } : n)),
        })),
      recordCollabEdit: () =>
        set((s) => {
          const d = today();
          if (s.collabEdits.date !== d) return { collabEdits: { date: d, count: 1 } };
          return { collabEdits: { date: d, count: s.collabEdits.count + 1 } };
        }),
      setPanelWidth: (panel, width) =>
        set(
          panel === "sidebar"
            ? { sidebarWidth: width }
            : panel === "ai"
              ? { aiPanelWidth: width }
              : { notesWidth: width },
        ),

      setPasscode: (docId, code) =>
        set((s) => ({
          tree: mapTree(s.tree, (n) =>
            n.id === docId ? { ...n, passcodeHash: hashCode(code) } : n,
          ),
          unlockedDocs: s.unlockedDocs.includes(docId)
            ? s.unlockedDocs
            : [...s.unlockedDocs, docId],
        })),
      clearPasscode: (docId) =>
        set((s) => ({
          tree: mapTree(s.tree, (n) =>
            n.id === docId ? { ...n, passcodeHash: undefined } : n,
          ),
        })),
      unlockDoc: (docId, code) => {
        const node = findNode(get().tree, docId);
        if (!node?.passcodeHash) return true;
        if (hashCode(code) === node.passcodeHash) {
          set((s) => ({ unlockedDocs: [...new Set([...s.unlockedDocs, docId])] }));
          return true;
        }
        return false;
      },
      lockDoc: (docId) =>
        set((s) => ({ unlockedDocs: s.unlockedDocs.filter((d) => d !== docId) })),
      lockAll: () => set({ unlockedDocs: [] }),
      setAutoLockMinutes: (autoLockMinutes) => set({ autoLockMinutes }),
      setPasscodeDialogOpen: (passcodeDialogOpen) => set({ passcodeDialogOpen }),
    }),
    {
      name: "easyframe-store",
      partialize: (s) => ({
        tree: s.tree,
        activeDocId: s.activeDocId,
        theme: s.theme,
        font: s.font,
        notes: s.notes,
        versions: s.versions,
        currentUserId: s.currentUserId,
        editTasks: s.editTasks,
        taskSeq: s.taskSeq,
        roleNotices: s.roleNotices,
        users: s.users,
        restoreRequests: s.restoreRequests,
        shares: s.shares,
        accessRequests: s.accessRequests,
        lineNumbers: s.lineNumbers,
        aiPanelOpen: s.aiPanelOpen,
        edition: s.edition,
        collabUnlocked: s.collabUnlocked,
        generatedInvite: s.generatedInvite,
        autoLockMinutes: s.autoLockMinutes,
        personalTeamCount: s.personalTeamCount,
        collabEdits: s.collabEdits,
        sidebarWidth: s.sidebarWidth,
        aiPanelWidth: s.aiPanelWidth,
        notesWidth: s.notesWidth,
        connectedClouds: s.connectedClouds,
        autosaveEnabled: s.autosaveEnabled,
        autosaveMinutes: s.autosaveMinutes,
        bookmarks: s.bookmarks,
        workMode: s.workMode,
        autocorrect: s.autocorrect,
        citations: s.citations,
        zoom: s.zoom,
        pageBorders: s.pageBorders,
        pageColors: s.pageColors,
        paperTextures: s.paperTextures,
        plan: s.plan,
        apiKeys: s.apiKeys,
        activeApiKeyId: s.activeApiKeyId,
        grid: s.grid,
        pageMargin: s.pageMargin,
        activityLog: s.activityLog,
        folderPermissions: s.folderPermissions,
        favoriteTemplates: s.favoriteTemplates,
        brightness: s.brightness,
        nightMode: s.nightMode,
        sceneNumbers: s.sceneNumbers,
        infiniteCanvas: s.infiniteCanvas,
        pageSize: s.pageSize,
        trash: s.trash,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

/* Selector helper used by components */
export function selectActiveDoc(s: StoreState): TreeNode | null {
  if (!s.activeDocId) return null;
  return findNode(s.tree, s.activeDocId);
}

/** Remaining Personal-plan collaborative edits for today. */
export function collabEditsRemaining(s: StoreState): number {
  const count = s.collabEdits.date === new Date().toISOString().slice(0, 10) ? s.collabEdits.count : 0;
  return Math.max(0, PERSONAL_DAILY_COLLAB_LIMIT - count);
}

/** True when a Personal user has hit the daily collaborative-edit cap. */
export function personalCollabLimitReached(s: StoreState): boolean {
  return s.edition === "personal" && collabEditsRemaining(s) <= 0;
}
