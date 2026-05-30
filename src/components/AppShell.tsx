import { NavLink, Outlet } from "react-router-dom";
import { Sparkles, FolderGit2, Package, MessageSquareText } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { to: "/projects", label: "Projects", icon: FolderGit2 },
  { to: "/skills", label: "Asset Repository", icon: Package },
  { to: "/prompts", label: "Prompts", icon: MessageSquareText },
];

export function AppShell() {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-border/60 bg-background/60 px-3 py-5 backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--accent-glow))] text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-gradient text-sm font-semibold tracking-tight">Agent Context Vault</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-1">
          <ThemeToggle />
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
