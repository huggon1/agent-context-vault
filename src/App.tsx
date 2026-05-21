import * as React from "react";
import { RefreshCw } from "lucide-react";
import { LibraryProvider, useLibrary } from "./context/LibraryContext";
import { TargetPathProvider, useTargetPath } from "./context/TargetPathContext";
import { AppHeader } from "./components/AppHeader";
import { TargetPathBar } from "./components/TargetPathBar";
import { SkillCard } from "./components/SkillCard";
import { PromptCard } from "./components/PromptCard";
import { DetailDrawer } from "./components/DetailDrawer";
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
    library?.skills.filter((s) => matches(`${s.title} ${s.description}`, search)) ?? [];
  const filteredPrompts =
    library?.prompts.filter((p) => matches(`${p.title} ${p.description}`, search)) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader search={search} onSearchChange={setSearch} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2 border-b">
          <TabButton active={tab === "skills"} onClick={() => setTab("skills")}>
            Skills {library ? `(${library.skills.length})` : ""}
          </TabButton>
          <TabButton active={tab === "prompts"} onClick={() => setTab("prompts")}>
            Prompts {library ? `(${library.prompts.length})` : ""}
          </TabButton>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            {loading ? <span>Loading…</span> : null}
            {error ? <button onClick={refresh} className="text-red-500 underline">Retry</button> : null}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                void refresh();
                void refreshInstalled();
              }}
              title="Refresh library and installed status"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        {error ? <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">{error}</div> : null}

        {tab === "skills" ? (
          <div className="space-y-4">
            <TargetPathBar />
            {!currentPath ? (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">
                Set a target project path above to enable install / uninstall.
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
              {filteredSkills.length === 0 && !loading ? (
                <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No skills match.</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPrompts.map((p) => (
              <PromptCard key={p.slug} prompt={p} onOpen={() => setOpenPrompt(p)} />
            ))}
            {filteredPrompts.length === 0 && !loading ? (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No prompts match.</p>
            ) : null}
          </div>
        )}
      </main>

      <DetailDrawer
        open={Boolean(openSkill)}
        onClose={() => setOpenSkill(null)}
        title={openSkill?.title ?? ""}
        description={openSkill?.description ?? ""}
        agents={openSkill?.agents ?? []}
        updatedAt={openSkill?.updatedAt ?? ""}
        body={openSkill?.readmeBody ?? ""}
      />
      <DetailDrawer
        open={Boolean(openPrompt)}
        onClose={() => setOpenPrompt(null)}
        title={openPrompt?.title ?? ""}
        description={openPrompt?.description ?? ""}
        agents={openPrompt?.agents ?? []}
        updatedAt={openPrompt?.updatedAt ?? ""}
        body={openPrompt?.readmeBody ?? ""}
        promptContent={openPrompt?.promptContent}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
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
