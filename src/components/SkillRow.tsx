import { Download, Trash2, ArrowUpCircle } from "lucide-react";
import { Button } from "./ui/button";
import { actionsForStatus } from "../lib/installActions";
import type { InstallStatus, Skill } from "../lib/types";

interface Props {
  skill: Skill;
  status: InstallStatus | null;
  selected: boolean;
  busy: boolean;
  onToggleSelect: () => void;
  onInstall: () => void;
  onUpdate: () => void;
  onUninstall: () => void;
}

const STATUS_META: Record<InstallStatus, { label: string; cls: string }> = {
  synced: { label: "Installed", cls: "text-emerald-600 dark:text-emerald-300" },
  "source-updated": { label: "Source updated", cls: "text-sky-600 dark:text-sky-300" },
  drift: { label: "Local drift", cls: "text-amber-600 dark:text-amber-300" },
  conflict: { label: "Conflict", cls: "text-red-600 dark:text-red-300" },
  unknown: { label: "Modified", cls: "text-amber-600 dark:text-amber-300" },
};

export function SkillRow({
  skill,
  status,
  selected,
  busy,
  onToggleSelect,
  onInstall,
  onUpdate,
  onUninstall,
}: Props) {
  const actions = actionsForStatus(status);
  const highlight = status === "drift" || status === "conflict";

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2.5 ${
        highlight ? "border-amber-500/50 bg-amber-500/5" : "border-border/60"
      }`}
    >
      {status === null ? (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="h-4 w-4"
          aria-label={`Select ${skill.name}`}
        />
      ) : (
        <span className="w-4" />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{skill.name}</div>
        <div className="truncate text-xs text-muted-foreground">{skill.description}</div>
      </div>
      {status ? (
        <span className={`text-xs font-medium ${STATUS_META[status].cls}`}>{STATUS_META[status].label}</span>
      ) : null}
      <div className="flex items-center gap-1.5">
        {actions.includes("install") ? (
          <Button size="sm" disabled={busy} onClick={onInstall}>
            <Download className="h-3.5 w-3.5" /> Install
          </Button>
        ) : null}
        {actions.includes("update") ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={onUpdate}>
            <ArrowUpCircle className="h-3.5 w-3.5" /> Update
          </Button>
        ) : null}
        {actions.includes("uninstall") ? (
          <Button size="sm" variant="ghost" disabled={busy} onClick={onUninstall} aria-label={`Uninstall ${skill.name}`}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
