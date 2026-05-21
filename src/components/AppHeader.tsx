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
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-normal">Agent Context Vault</h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              Manage skills and prompts for your coding agents
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search title or description"
          className="md:max-w-xl"
        />
      </div>
    </header>
  );
}
