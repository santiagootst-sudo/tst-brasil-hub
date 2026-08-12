export type ProfileKind = "autonomo" | "clt";

export const REMEMBERED_PROFILE_KEY = "portal-tst-remembered-profile";

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem" | "removeItem">;

export function readRememberedProfile(storage: StorageReader | null | undefined): ProfileKind | null {
  if (!storage) return null;
  try {
    const value = storage.getItem(REMEMBERED_PROFILE_KEY);
    return value === "autonomo" || value === "clt" ? value : null;
  } catch {
    return null;
  }
}

export function rememberProfile(storage: StorageWriter | null | undefined, kind: ProfileKind): boolean {
  if (!storage) return false;
  try {
    storage.setItem(REMEMBERED_PROFILE_KEY, kind);
    return true;
  } catch {
    return false;
  }
}

export function clearRememberedProfile(storage: StorageWriter | null | undefined): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(REMEMBERED_PROFILE_KEY);
    return true;
  } catch {
    return false;
  }
}
