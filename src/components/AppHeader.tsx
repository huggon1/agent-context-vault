import { Search, Sparkles } from "lucide-react";
import { Input } from "./ui/input";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--accent-glow))] text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.7)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight">
                <span className="text-gradient">Agent Context Vault</span>
              </h1>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                Curated skills & prompts for your coding agents
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
        <div className="relative md:max-w-2xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search skills, prompts, descriptions…"
            className="pl-10"
          />
        </div>
      </div>
    </header>
  );
}
