import * as React from "react";
import { RefreshCw, Sparkles, MessageSquareText, SearchX, Download, FilePlus } from "lucide-react";
import { LibraryProvider, useLibrary } from "./context/LibraryContext";
import { TargetPathProvider, useTargetPath } from "./context/TargetPathContext";
import { AppHeader } from "./components/AppHeader";
import { TargetPathBar } from "./components/TargetPathBar";
import { SkillCard } from "./components/SkillCard";
import { PromptCard } from "./components/PromptCard";
import { DetailDrawer } from "./components/DetailDrawer";
import { ImportPanel } from "./components/ImportPanel";
import { CreatePromptDrawer } from "./components/CreatePromptDrawer";
import { Button } from "./components/ui/button";
import type { Prompt, Skill } from "./lib/types";

type Tab = "skills" | "prompts";

function matches(text: string, query: string) {
  if (!query) return true;
  return text.toLowerCase().includes(query.toLowerCase());
}

function LibraryView() {
  const { library, loading, error, refresh } = useLibrary();
  const { installed, currentPath, refreshInstalled } = useTargetPath();
  const [tab, setTab] = React.useState<Tab>("skills");
  const [search, setSearch] = React.useState("");
  const [importOpen, setImportOpen] = React.useState(false);
  const [createPromptOpen, setCreatePromptOpen] = React.useState(false);
  const [openSkill, setOpenSkill] = React.useState<Skill | null>(null);
  const [openPrompt, setOpenPrompt] = React.useState<Prompt | null>(null);

  const installedBySlug = React.useMemo(() => {
    const m = new Map<string, typeof installed>();
    for (const x of installed) {
      const list = m.get(x.slug) ?? [];
      list.push(x);
      m.set(x.slug, list);
    }
    return m;
  }, [installed]);

  const filteredSkills =
    library?.skills.filter((s) => matches(`${s.name} ${s.description}`, search)) ?? [];
  const filteredPrompts =
    library?.prompts.filter((p) => matches(`${p.title} ${p.description}`, search)) ?? [];

  const skillCount = library?.skills.length ?? 0;
  const promptCount = library?.prompts.length ?? 0;

  return (
    <div className="relative min-h-screen">
      <AppHeader search={search} onSearchChange={setSearch} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <SegmentedTabs
            value={tab}
            onChange={setTab}
            options={[
              { value: "skills", label: "Skills", count: skillCount, icon: Sparkles },
              { value: "prompts", label: "Prompts", count: promptCount, icon: MessageSquareText },
            ]}
          />
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            {loading ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Loading…
              </span>
            ) : null}
            {error ? (
              <button onClick={refresh} className="text-red-500 underline-offset-2 hover:underline">
                Retry
              </button>
            ) : null}
            {tab === "skills" ? (
              <Button
                type="button"
                size="sm"
                variant={importOpen ? "outline" : "ghost"}
                onClick={() => setImportOpen((v) => !v)}
                title="Import a skill from GitHub"
              >
                <Download className="h-3.5 w-3.5" /> Import
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant={createPromptOpen ? "outline" : "ghost"}
                onClick={() => setCreatePromptOpen((v) => !v)}
                title="Create a new prompt"
              >
                <FilePlus className="h-3.5 w-3.5" /> New Prompt
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                void refresh();
                void refreshInstalled();
              }}
              title="Refresh library and installed status"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {tab === "skills" ? (
          <div className="space-y-5">
            <TargetPathBar />
            {importOpen ? (
              <ImportPanel onClose={() => setImportOpen(false)} />
            ) : null}
            {!currentPath ? (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-semibold">!</span>
                <p>
                  Set a target project path above to enable install / uninstall.
                </p>
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSkills.map((s) => (
                <SkillCard
                  key={s.slug}
                  skill={s}
                  statuses={installedBySlug.get(s.slug) ?? []}
                  onOpen={() => setOpenSkill(s)}
                />
              ))}
            </div>
            {filteredSkills.length === 0 && !loading ? <EmptyState query={search} /> : null}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPrompts.map((p) => (
                <PromptCard key={p.slug} prompt={p} onOpen={() => setOpenPrompt(p)} />
              ))}
            </div>
            {filteredPrompts.length === 0 && !loading ? <EmptyState query={search} /> : null}
          </>
        )}
      </main>

      <DetailDrawer
        open={Boolean(openSkill)}
        onClose={() => setOpenSkill(null)}
        slug={openSkill?.slug ?? ""}
        assetType="skill"
        title={openSkill?.name ?? ""}
        description={openSkill?.description ?? ""}
        updatedAt={openSkill?.updatedAt ?? ""}
        body={openSkill?.readmeBody ?? ""}
        onSlugChange={() => setOpenSkill(null)}
      />
      <DetailDrawer
        open={Boolean(openPrompt)}
        onClose={() => setOpenPrompt(null)}
        slug={openPrompt?.slug ?? ""}
        assetType="prompt"
        title={openPrompt?.title ?? ""}
        description={openPrompt?.description ?? ""}
        updatedAt={openPrompt?.updatedAt ?? ""}
        body=""
        promptContent={openPrompt?.promptContent}
      />
      <CreatePromptDrawer
        open={createPromptOpen}
        onClose={() => setCreatePromptOpen(false)}
      />
    </div>
  );
}

interface SegmentedTabOption<T> {
  value: T;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedTabOption<T>[];
}) {
  return (
    <div className="glass inline-flex items-center gap-1 rounded-full p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-gradient-to-br from-primary to-[hsl(var(--accent-glow))] text-primary-foreground shadow-[0_6px_20px_-8px_hsl(var(--primary)/0.6)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {opt.label}
            {typeof opt.count === "number" ? (
              <span
                className={`rounded-full px-1.5 py-px text-[10px] tabular-nums ${
                  active ? "bg-white/20" : "bg-muted text-muted-foreground"
                }`}
              >
                {opt.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="glass mt-2 flex flex-col items-center justify-center gap-2 rounded-2xl px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <SearchX className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium">No matches</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        {query
          ? `Nothing matched "${query}". Try a different keyword or clear the search.`
          : "Nothing here yet."}
      </p>
    </div>
  );
}

export default function App() {
  return (
    <LibraryProvider>
      <TargetPathProvider>
        <LibraryView />
      </TargetPathProvider>
    </LibraryProvider>
  );
}
