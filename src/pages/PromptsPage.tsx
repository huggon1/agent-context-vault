import * as React from "react";
import { FilePlus, RefreshCw } from "lucide-react";
import { useLibrary } from "../context/LibraryContext";
import { PromptCard } from "../components/PromptCard";
import { DetailDrawer } from "../components/DetailDrawer";
import { CreatePromptDrawer } from "../components/CreatePromptDrawer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import type { Prompt } from "../lib/types";

export function PromptsPage() {
  const { library, loading, refresh } = useLibrary();
  const [search, setSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [open, setOpen] = React.useState<Prompt | null>(null);

  const prompts = library?.prompts ?? [];
  const q = search.toLowerCase();
  const filtered = prompts.filter((p) => `${p.title} ${p.description}`.toLowerCase().includes(q));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prompts</h1>
          <p className="text-sm text-muted-foreground">Reusable prompts, independent of projects.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant={createOpen ? "outline" : "ghost"} onClick={() => setCreateOpen((v) => !v)}>
            <FilePlus className="h-3.5 w-3.5" /> New Prompt
          </Button>
          <Button size="sm" variant="outline" onClick={() => void refresh()}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search prompts…" className="md:max-w-md" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <PromptCard key={p.slug} prompt={p} onOpen={() => setOpen(p)} />
        ))}
      </div>
      {filtered.length === 0 && !loading ? (
        <p className="text-sm text-muted-foreground">No prompts.</p>
      ) : null}
      <DetailDrawer
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        slug={open?.slug ?? ""}
        assetType="prompt"
        title={open?.title ?? ""}
        description={open?.description ?? ""}
        updatedAt={open?.updatedAt ?? ""}
        body=""
        promptContent={open?.promptContent}
      />
      <CreatePromptDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
