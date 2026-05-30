import * as React from "react";
import { Download, RefreshCw } from "lucide-react";
import { useLibrary } from "../context/LibraryContext";
import { SkillCard } from "../components/SkillCard";
import { DetailDrawer } from "../components/DetailDrawer";
import { ImportPanel } from "../components/ImportPanel";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import type { Skill } from "../lib/types";

export function SkillsPage() {
  const { library, loading, refresh } = useLibrary();
  const [search, setSearch] = React.useState("");
  const [importOpen, setImportOpen] = React.useState(false);
  const [open, setOpen] = React.useState<Skill | null>(null);

  const skills = library?.skills ?? [];
  const q = search.toLowerCase();
  const filtered = skills.filter((s) => `${s.name} ${s.description}`.toLowerCase().includes(q));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Asset Repository</h1>
          <p className="text-sm text-muted-foreground">Your library of reusable skills.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant={importOpen ? "outline" : "ghost"} onClick={() => setImportOpen((v) => !v)}>
            <Download className="h-3.5 w-3.5" /> Import
          </Button>
          <Button size="sm" variant="outline" onClick={() => void refresh()}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search skills…" className="md:max-w-md" />
      {importOpen ? <ImportPanel onClose={() => setImportOpen(false)} /> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <SkillCard key={s.slug} skill={s} onOpen={() => setOpen(s)} />
        ))}
      </div>
      {filtered.length === 0 && !loading ? (
        <p className="text-sm text-muted-foreground">No skills.</p>
      ) : null}
      <DetailDrawer
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        slug={open?.slug ?? ""}
        assetType="skill"
        title={open?.name ?? ""}
        description={open?.description ?? ""}
        updatedAt={open?.updatedAt ?? ""}
        body={open?.readmeBody ?? ""}
        onSlugChange={() => setOpen(null)}
      />
    </div>
  );
}
