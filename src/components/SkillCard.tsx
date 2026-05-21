import * as React from "react";
import { CheckCircle2, AlertTriangle, Download, RefreshCw, Trash2, ArrowUpRight } from "lucide-react";
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
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="group/title -m-1 inline-flex items-start gap-1 rounded p-1 text-left"
          >
            <h3 className="line-clamp-2 text-base font-semibold tracking-tight group-hover/title:text-primary">
              {skill.title}
            </h3>
            <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover/title:translate-x-0.5 group-hover/title:-translate-y-0.5 group-hover/title:opacity-100 group-hover/title:text-primary" />
          </button>
          {installedCount > 0 ? (
            anyModified ? (
              <Badge
                variant="outline"
                className="shrink-0 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              >
                <AlertTriangle className="h-3 w-3" /> Modified
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="shrink-0 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              >
                <CheckCircle2 className="h-3 w-3" /> Installed · {installedCount}
              </Badge>
            )
          ) : null}
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{skill.description}</p>
      </CardHeader>
      <CardContent className="mt-auto space-y-4">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <AgentBadges agents={skill.agents} />
          <span title={skill.updatedAt}>
            {formatRelative(skill.updatedAt) || formatDate(skill.updatedAt)}
          </span>
        </div>

        <div className="-mx-1 space-y-1.5 rounded-xl bg-muted/30 p-2 backdrop-blur-sm">
          {targets.map((agent) => {
            const status = statusByAgent.get(agent);
            const label = AGENT_OPTIONS.find((a) => a.id === agent)?.label;
            const disabled = !currentPath || busy === agent;
            return (
              <div key={agent} className="flex flex-wrap items-center gap-2">
                <span className="flex min-w-[6.5rem] items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      status
                        ? status.modified
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                        : "bg-muted-foreground/40"
                    }`}
                  />
                  {label}
                </span>
                {status ? (
                  <div className="ml-auto flex items-center gap-1.5">
                    <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => doInstall(agent)}>
                      <RefreshCw className="h-3.5 w-3.5" /> Reinstall
                    </Button>
                    <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => doUninstall(agent)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="ml-auto">
                    <Button type="button" size="sm" disabled={disabled} onClick={() => doInstall(agent)}>
                      <Download className="h-3.5 w-3.5" /> Install
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex">
          <Button type="button" size="sm" variant="ghost" onClick={onOpen} className="ml-auto">
            View details <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
