import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, FolderPlus, FolderGit2 } from "lucide-react";
import { useProjects } from "../context/ProjectsContext";
import { fetchInstalled } from "../api/client";
import { useToast } from "../components/ui/toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import type { Project } from "../lib/types";

export function ProjectsPage() {
  const { projects, loading, error, register, remove } = useProjects();
  const { toast } = useToast();
  const [path, setPath] = React.useState("");
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!path.trim()) return;
    setSubmitting(true);
    try {
      await register(path.trim(), name.trim() || undefined);
      setPath("");
      setName("");
      toast({ title: "Project registered" });
    } catch (err) {
      toast({ title: "Could not register", description: err instanceof Error ? err.message : String(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Register a project by its absolute path, then open it to install skills.
        </p>
      </div>

      <form onSubmit={onRegister} className="glass flex flex-col gap-2 rounded-2xl p-4 md:flex-row md:items-center">
        <Input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/absolute/path/to/project"
          className="font-mono text-xs md:flex-1"
          disabled={submitting}
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Display name (optional)"
          className="md:w-56"
          disabled={submitting}
        />
        <Button type="submit" size="sm" disabled={submitting || !path.trim()}>
          <FolderPlus className="h-3.5 w-3.5" /> Register
        </Button>
      </form>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects yet. Register one above.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onDelete={() => {
                if (
                  window.confirm(`Remove "${p.name}" from the list? (the folder on disk is not touched)`)
                ) {
                  void remove(p.id);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: () => void }) {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState<{ installed: number; drift: number; updatable: number } | null>(null);

  React.useEffect(() => {
    let active = true;
    fetchInstalled(project.id)
      .then(({ installed }) => {
        if (!active) return;
        setStats({
          installed: installed.length,
          drift: installed.filter((e) => e.status === "drift" || e.status === "conflict" || e.status === "unknown").length,
          updatable: installed.filter((e) => e.status === "source-updated").length,
        });
      })
      .catch(() => {
        if (active) setStats(null);
      });
    return () => {
      active = false;
    };
  }, [project.id]);

  return (
    <Card className="flex flex-col transition-colors hover:border-primary/40">
      <CardHeader>
        <button type="button" onClick={() => navigate(`/projects/${project.id}`)} className="text-left">
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-4 w-4 text-primary" />
            <h3 className="truncate text-base font-semibold tracking-tight">{project.name}</h3>
          </div>
          <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{project.path}</p>
        </button>
      </CardHeader>
      <CardContent className="mt-auto flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {stats ? (
            <>
              <span className="rounded-full border border-border/60 px-2 py-0.5">Installed {stats.installed}</span>
              {stats.drift > 0 ? (
                <span className="rounded-full border border-amber-500/50 px-2 py-0.5 text-amber-600 dark:text-amber-300">
                  ⚠ {stats.drift}
                </span>
              ) : null}
              {stats.updatable > 0 ? (
                <span className="rounded-full border border-sky-500/50 px-2 py-0.5 text-sky-600 dark:text-sky-300">
                  ↑ {stats.updatable}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-muted-foreground">…</span>
          )}
        </div>
        <Button type="button" size="icon" variant="ghost" onClick={onDelete} aria-label="Remove project">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
