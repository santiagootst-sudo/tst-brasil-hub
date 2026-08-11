export type WorkspaceRole = "owner" | "manager" | "member";

export function canReadWorkspace(role: WorkspaceRole | null | undefined) {
  return role === "owner" || role === "manager" || role === "member";
}

export function canManageWorkspace(role: WorkspaceRole | null | undefined) {
  return role === "owner" || role === "manager";
}
