import * as React from "react";
import { CheckCircle2, AlertTriangle, Download, RefreshCw, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { AgentBadges } from "./AgentBadges";
import { useToast } from "./ui/toast";
import { installSkill, uninstallSkill } from "../api/client";
import { useTargetPath } from "../context/TargetPathContext";
import { formatRelative, formatDate } from "../lib/time";
import type { InstallAgent, InstalledEntry, Skill } from "../lib/types";

const AGENT_OPTIONS: { id: InstallAgent; label: string }[] = [
  { id: "claude-code", label: "Claude Code" },
  { id: "codex", label: "Codex" },
];

interface Props {
  skill: Skill;
  statuses: InstalledEntry[];
  onOpen: () => void;
}

function supportedAgents(skill: Skill): InstallAgent[] {
  if (!skill.agents || skill.agents.length === 0 || skill.agents.includes("all")) {
    return AGENT_OPTIONS.map((a) => a.id);
  }
  return AGENT_OPTIONS.map((a) => a.id).filter((id) => skill.agents.includes(id));
}

export function SkillCard({ skill, statuses, onOpen }: Props) {
  const { currentPath, refreshInstalled } = useTargetPath();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState<InstallAgent | null>(null);

  const targets = supportedAgents(skill);
  const statusByAgent = new Map<InstallAgent, InstalledEntry>();
  for (const s of statuses) statusByAgent.set(s.agent, s);
  const installedCount = statuses.length;
  const anyModified = statuses.some((s) => s.modified);

  async function doInstall(agent: InstallAgent) {
    if (!currentPath) return;
    setBusy(agent);
    try {
      await installSkill(skill.slug, currentPath, agent);
      await refreshInstalled();
      toast({ title: `Installed ${skill.title}`, description: `→ ${AGENT_OPTIONS.find((a) => a.id === agent)?.label}` });
    } catch (err) {
      toast({ title: "Install failed", description: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(null);
    }
  }

  async function doUninstall(agent: InstallAgent, force = false) {
    if (!currentPath) return;
    setBusy(agent);
    try {
      await uninstallSkill(skill.slug, currentPath, agent, force);
      await refreshInstalled();
      toast({ title: `Uninstalled ${skill.title}`, description: `← ${AGENT_OPTIONS.find((a) => a.id === agent)?.label}` });
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status === 409 && !force) {
        const ok = window.confirm(
          `${skill.title} has local modifications. Remove anyway?`,
        );
        if (ok) {
          setBusy(null);
          return doUninstall(agent, true);
        }
      } else {
        toast({ title: "Uninstall failed", description: e.message });
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={onOpen} className="text-left">
            <h3 className="line-clamp-2 text-base font-semibold hover:underline">{skill.title}</h3>
          </button>
          {installedCount > 0 ? (
            anyModified ? (
              <Badge className="shrink-0 bg-amber-500/15 text-amber-700 dark:text-amber-300" variant="outline">
                <AlertTriangle className="mr-1 h-3 w-3" /> Modified
              </Badge>
            ) : (
              <Badge className="shrink-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" variant="outline">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Installed ({installedCount})
              </Badge>
            )
          ) : null}
        </div>
        <p className="line-clamp-3 text-sm text-muted-foreground">{skill.description}</p>
      </CardHeader>
      <CardContent className="mt-auto space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <AgentBadges agents={skill.agents} />
          <span title={skill.updatedAt}>Updated {formatRelative(skill.updatedAt) || formatDate(skill.updatedAt)}</span>
        </div>
        <div className="space-y-2">
          {targets.map((agent) => {
            const status = statusByAgent.get(agent);
            const label = AGENT_OPTIONS.find((a) => a.id === agent)?.label;
            const disabled = !currentPath || busy === agent;
            return (
              <div key={agent} className="flex flex-wrap items-center gap-2">
                <span className="min-w-[7rem] text-xs font-medium text-muted-foreground">{label}</span>
                {status ? (
                  <>
                    <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => doInstall(agent)}>
                      <RefreshCw className="h-4 w-4" /> Reinstall
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => doUninstall(agent)}>
                      <Trash2 className="h-4 w-4" /> Uninstall
                    </Button>
                    {status.modified ? (
                      <span className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400">modified</span>
                    ) : null}
                  </>
                ) : (
                  <Button type="button" size="sm" disabled={disabled} onClick={() => doInstall(agent)}>
                    <Download className="h-4 w-4" /> Install
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <div>
          <Button type="button" size="sm" variant="ghost" onClick={onOpen}>
            View details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
