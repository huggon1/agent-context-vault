import type { InstallStatus } from "./types";

export type RowAction = "install" | "update" | "uninstall";

/** Which row actions to show for a skill's status (null = not installed). */
export function actionsForStatus(status: InstallStatus | null): RowAction[] {
  if (status === null) return ["install"];
  if (status === "synced") return ["uninstall"];
  return ["update", "uninstall"];
}

/** True when an action would overwrite/discard possibly-edited local files. */
export function needsConfirm(status: InstallStatus | null): boolean {
  return status === "drift" || status === "conflict" || status === "unknown";
}
