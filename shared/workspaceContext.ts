export function workspaceIdFromSearch(search: string): number | null {
  const workspaceId = Number(new URLSearchParams(search).get("workspace"));
  return Number.isSafeInteger(workspaceId) && workspaceId > 0 ? workspaceId : null;
}

export function withWorkspaceContext(path: string, workspaceId: number | null): string {
  if (!workspaceId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}workspace=${workspaceId}`;
}
