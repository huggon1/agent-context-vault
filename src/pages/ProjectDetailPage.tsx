import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useLibrary } from "../context/LibraryContext";
import { useProjects } from "../context/ProjectsContext";
import { fetchInstalled, installSkill, uninstallSkill } from "../api/client";
import { useToast } from "../components/ui/toast";
import { SkillRow } from "../components/SkillRow";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { needsConfirm } from "../lib/installActions";
import type { InstallAgent, InstalledEntry, InstallStatus } from "../lib/types";

const AGENTS: { id: InstallAgent; label: string }[] = [
  { id: "claude-code", label: "Claude Code" },
  { id: "codex", label: "Codex" },
];

export function ProjectDetailPage() {
  const { id = "" } = useParams();
  const { projects, loading } = useProjects();
  const { library } = useLibrary();
  const { toast } = useToast();
  const project = projects.find((p) => p.id === id) ?? null;

  const [agent, setAgent] = React.useState<InstallAgent>("claude-code");
  const [installed, setInstalled] = React.useState<InstalledEntry[]>([]);
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState<string | null>(null);
  const [batching, setBatching] = React.useState(false);

  const refreshInstalled = React.useCallback(async () => {
    if (!id) return;
    try {
      const { installed } = await fetchInstalled(id);
      setInstalled(installed);
    } catch {
      // ignore refresh errors; each mutation reports its own failures
    }
  }, [id]);

  React.useEffect(() => {
    void refreshInstalled();
  }, [refreshInstalled]);

  const statusMap = React.useMemo(() => {
    const m = new Map<string, InstallStatus>();
    for (const e of installed) m.set(`${e.slug}:${e.agent}`, e.status);
    return m;
  }, [installed]);
  const statusFor = (slug: string): InstallStatus | null => statusMap.get(`${slug}:${agent}`) ?? null;

  const skills = library?.skills ?? [];
  const q = search.toLowerCase();
  const filtered = skills.filter((s) => `${s.name} ${s.description}`.toLowerCase().includes(q));

  const installedCount = installed.length;
  const driftCount = installed.filter((e) => e.status === "drift" || e.status === "conflict" || e.status === "unknown").length;
  const updatableCount = installed.filter((e) => e.status === "source-updated").length;

  async function doInstall(slug: string) {
    if (!id) return;
    setBusy(slug);
    try {
      await installSkill(slug, id, agent);
      await refreshInstalled();
      toast({ title: `Installed ${slug}` });
    } catch (err) {
      toast({ title: "Install failed", description: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(null);
    }
  }

  async function doUpdate(slug: string) {
    if (needsConfirm(statusFor(slug)) && !window.confirm(`${slug} has local changes. Updating overwrites them. Continue?`)) {
      return;
    }
    await doInstall(slug); // install overwrites + refreshes the baseline
  }

  async function doUninstall(slug: string) {
    if (!id) return;
    const force = needsConfirm(statusFor(slug));
    if (force && !window.confirm(`${slug} has local changes. Remove anyway?`)) return;
    setBusy(slug);
    try {
      await uninstallSkill(slug, id, agent, force);
      await refreshInstalled();
      toast({ title: `Uninstalled ${slug}` });
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status === 409 && !force && window.confirm(`${slug} has local changes. Remove anyway?`)) {
        try {
          await uninstallSkill(slug, id, agent, true);
          await refreshInstalled();
          toast({ title: `Uninstalled ${slug}` });
        } catch (err2) {
          toast({ title: "Uninstall failed", description: err2 instanceof Error ? err2.message : String(err2) });
        }
      } else {
        toast({ title: "Uninstall failed", description: e.message });
      }
    } finally {
      setBusy(null);
    }
  }

  function toggleSelect(slug: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(slug)) n.delete(slug);
      else n.add(slug);
      return n;
    });
  }

  async function batchInstall() {
    if (!id) return;
    const slugs = [...selected].filter((slug) => statusFor(slug) === null);
    setBatching(true);
    let failures = 0;
    for (const slug of slugs) {
      try {
        await installSkill(slug, id, agent);
      } catch {
        failures += 1;
      }
    }
    setSelected(new Set());
    await refreshInstalled();
    setBatching(false);
    toast({ title: `Installed ${slugs.length - failures} of ${slugs.length} skill(s)` });
  }

  if (loading && !project) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!project) {
    return (
      <div className="text-sm text-muted-foreground">
        Project not found.{" "}
        <Link className="text-primary underline" to="/projects">
          Back to projects
        </Link>
      </div>
    );
  }

  const selectableSelected = [...selected].filter((slug) => statusFor(slug) === null);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Projects
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="font-mono text-xs text-muted-foreground">{project.path}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-border/60 px-3 py-1">Installed {installedCount}</span>
          {driftCount > 0 ? (
            <span className="rounded-full border border-amber-500/50 px-3 py-1 text-amber-600 dark:text-amber-300">
              ⚠ {driftCount} drift
            </span>
          ) : null}
          {updatableCount > 0 ? (
            <span className="rounded-full border border-sky-500/50 px-3 py-1 text-sky-600 dark:text-sky-300">
              ↑ {updatableCount} updatable
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search skills…" className="md:max-w-xs" />
        <div role="group" aria-label="Target agent" className="inline-flex rounded-lg border border-border/60 p-0.5">
          {AGENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={agent === a.id}
              onClick={() => {
                setAgent(a.id);
                setSelected(new Set());
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                agent === a.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        {selectableSelected.length > 0 ? (
          <Button size="sm" className="ml-auto" disabled={batching} onClick={batchInstall}>
            Install selected ({selectableSelected.length})
          </Button>
        ) : null}
      </div>

      <div className="space-y-2">
        {filtered.map((s) => (
          <SkillRow
            key={s.slug}
            skill={s}
            status={statusFor(s.slug)}
            selected={selected.has(s.slug)}
            busy={busy === s.slug || batching}
            onToggleSelect={() => toggleSelect(s.slug)}
            onInstall={() => doInstall(s.slug)}
            onUpdate={() => doUpdate(s.slug)}
            onUninstall={() => doUninstall(s.slug)}
          />
        ))}
        {filtered.length === 0 ? <p className="text-sm text-muted-foreground">No skills.</p> : null}
      </div>
    </div>
  );
}
