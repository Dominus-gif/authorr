/**
 * Billing plans & feature entitlements (local simulation, like editions/RBAC).
 *
 * This is a SEPARATE axis from `edition` (Personal/Workspace, the collaboration
 * toggle). A `plan` is the billing tier. The Free plan keeps all core writing &
 * rich-text editing tools, but locks premium surfaces behind an upgrade modal
 * that targets Pro. Pro and Team unlock the premium features; Team additionally
 * unlocks real collaboration / sharing / the team dashboard.
 */

export type Plan = "free" | "pro" | "team";

/** Every gateable premium capability. Core editing tools are intentionally NOT
 *  in this list — they stay free. */
export type Feature =
  | "aiSuite"
  | "byok"
  | "keyManagement"
  | "templates"
  | "paperTexture"
  | "pageLayout"
  | "advancedFormatting"
  | "versionHistory"
  | "passcode"
  | "premiumThemes"
  | "pdfExport"
  | "docxExport"
  | "efExport"
  | "workModes"
  | "advancedGrid"
  | "gridCustomColor"
  | "sharing"
  | "collaboration"
  | "teamDashboard";

const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, team: 2 };

/** The lowest plan that includes each feature. */
const FEATURE_MIN_PLAN: Record<Feature, Plan> = {
  aiSuite: "pro",
  byok: "pro",
  keyManagement: "pro",
  templates: "pro",
  paperTexture: "pro",
  pageLayout: "pro",
  advancedFormatting: "pro",
  versionHistory: "pro",
  passcode: "pro",
  premiumThemes: "pro",
  pdfExport: "pro",
  docxExport: "pro",
  efExport: "pro",
  workModes: "pro",
  advancedGrid: "pro",
  gridCustomColor: "pro",
  // Team-tier — real multi-user features
  sharing: "team",
  collaboration: "team",
  teamDashboard: "team",
};

/** Human label shown in the upgrade modal for each feature. */
export const FEATURE_LABEL: Record<Feature, string> = {
  aiSuite: "The AI editing suite",
  byok: "Bring your own API key",
  keyManagement: "API key management",
  templates: "Templates & document presets",
  paperTexture: "Paper textures & canvas backgrounds",
  pageLayout: "Page layouts & custom margins",
  advancedFormatting: "Advanced formatting controls",
  versionHistory: "Version history & document recovery",
  passcode: "Document passcodes & protection",
  premiumThemes: "Premium themes",
  pdfExport: "PDF export",
  docxExport: "Word (.docx) export",
  efExport: "Signed .ef export",
  workModes: "Professional, Scriptwriting & Academic modes",
  advancedGrid: "Advanced grid configuration",
  gridCustomColor: "Custom grid colors & opacity",
  sharing: "Document sharing",
  collaboration: "Real-time collaboration",
  teamDashboard: "The Team dashboard",
};

export interface PlanMeta {
  id: Plan;
  name: string;
  price: string;
  tagline: string;
}

export const PLAN_META: Record<Plan, PlanMeta> = {
  free: { id: "free", name: "Free", price: "$0", tagline: "Core writing, distraction-free." },
  pro: { id: "pro", name: "Pro", price: "$8/mo", tagline: "The full writing studio for one." },
  team: { id: "team", name: "Team", price: "$15/mo", tagline: "Pro, plus real collaboration." },
};

export const PLAN_ORDER: Plan[] = ["free", "pro", "team"];

/** Does `plan` include `feature`? */
export function planAllows(plan: Plan, feature: Feature): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}

/** The plan a user must reach to unlock a feature (for "Upgrade to X" copy). */
export function requiredPlan(feature: Feature): Plan {
  return FEATURE_MIN_PLAN[feature];
}

// ── Free-plan inclusions (the allowed subset) ──────────────────────────────
/** Standard Light + Dark themes available on Free. Everything else is premium. */
export const FREE_THEMES = new Set(["light", "eclipse"]);
/** Free downloads are limited to plain Text + Markdown. */
export const FREE_EXPORTS = new Set(["txt", "md"]);
/** Free locks the writing assistant to the casual style only. */
export const FREE_WORKMODE = "casual" as const;
/** Storage caps on Free. */
export const FREE_MAX_FOLDERS = 1;
export const FREE_MAX_DOCS = 3;

// ── Grid / canvas customization defaults (Pro unlocks editing these) ────────
export interface GridSettings {
  /** Cell size for graph / grid + ruled-line spacing, in px. */
  cellSize: number;
  /** Spacing for the dotted-grid texture, in px. */
  dotDistance: number;
  /** Custom line/dot color (hex). null = auto (derives from theme text, so it
   *  inverts automatically when the theme changes). */
  color: string | null;
  /** Line/dot opacity 0.05–1. */
  opacity: number;
  /** When true the custom color is pinned and will NOT change on theme switch. */
  locked: boolean;
}

export const DEFAULT_GRID: GridSettings = {
  cellSize: 22,
  dotDistance: 22,
  color: null,
  opacity: 0.28,
  locked: false,
};
