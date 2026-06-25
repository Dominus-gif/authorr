import type { Edition, Role } from "./types";

export interface PermContext {
  role: Role;
  edition: Edition;
  /** Personal edition: collaboration unlocked via an accepted invite code */
  collabUnlocked: boolean;
}

/** Author and co-author can modify document content. */
export function canEdit(role: Role): boolean {
  return role === "author" || role === "co-author";
}

/** Collaboration is on in Workspace, or in Personal once an invite is accepted. */
export function collabAvailable(ctx: PermContext): boolean {
  return ctx.edition === "workspace" || (ctx.edition === "personal" && ctx.collabUnlocked);
}

/** @mentions / edit-request assignment require collaboration + edit rights. */
export function canMention(ctx: PermContext): boolean {
  return collabAvailable(ctx) && canEdit(ctx.role);
}

/** Sharing a note/space — owners and co-authors. */
export function canShare(ctx: PermContext): boolean {
  return canEdit(ctx.role);
}

/** Team/workspace management is a Workspace-edition capability. */
export function canManageWorkspace(ctx: PermContext): boolean {
  return ctx.edition === "workspace" && canEdit(ctx.role);
}

/** Viewers/users can still comment & annotate (reflect) without editing text. */
export function canComment(): boolean {
  return true;
}

/** A feature that only exists in the Workspace edition (drives upgrade prompts). */
export function isWorkspaceOnly(ctx: PermContext, feature: "realtime" | "team"): boolean {
  return ctx.edition !== "workspace" && (feature === "realtime" || feature === "team");
}
