import * as React from "react";
import { FolderOpen, ArrowRight, X, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useTargetPath } from "../context/TargetPathContext";
import { useToast } from "./ui/toast";

export function TargetPathBar() {
  const { currentPath, recentPaths, setCurrentPath, removeRecentPath } = useTargetPath();
  const { toast } = useToast();
  const [value, setValue] = React.useState(currentPath);
  const [pendingRemove, setPendingRemove] = React.useState<string | null>(null);

  React.useEffect(() => {
    setValue(currentPath);
  }, [currentPath]);

  async function apply(next: string) {
    const trimmed = next.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("/")) {
      window.alert("Please use an absolute path (starting with /).");
      return;
    }
    await setCurrentPath(trimmed);
  }

  async function handleRemove(p: string) {
    try {
      await removeRecentPath(p);
      toast({
        title: "Removed from recent",
        description: p === currentPath ? "Current target was also cleared." : undefined,
      });
    } catch (err) {
      toast({
        title: "Remove failed",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setPendingRemove(null);
    }
  }

  return (
    <div className="glass rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FolderOpen className="h-3.5 w-3.5" />
          </span>
          <span>Target project path</span>
          <span className="text-xs font-normal text-muted-foreground">
            where skills will be installed
          </span>
          {currentPath ? (
            <button
              type="button"
              onClick={() => void setCurrentPath("")}
              className="ml-auto text-xs font-normal text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              title="Clear the active target (keeps it in recent list)"
            >
              Clear current
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="/absolute/path/to/your/project"
            onKeyDown={(e) => {
              if (e.key === "Enter") void apply(value);
            }}
            className="font-mono text-xs md:flex-1"
          />
          <Button type="button" onClick={() => void apply(value)}>
            Apply <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {recentPaths.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Recent</span>
            {recentPaths.map((p) => {
              const active = p === currentPath;
              const confirming = pendingRemove === p;
              return (
                <span
                  key={p}
                  className={`group/pill inline-flex items-stretch overflow-hidden rounded-full border transition-all ${
                    active
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/60 bg-card/30 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void apply(p)}
                    className="px-2.5 py-1 font-mono text-left"
                    title={active ? "Current target" : "Switch to this path"}
                  >
                    {p}
                  </button>
                  {confirming ? (
                    <span className="flex items-center border-l border-current/20 bg-red-500/15 pr-0.5 text-red-600 dark:text-red-300">
                      <button
                        type="button"
                        onClick={() => void handleRemove(p)}
                        className="flex h-full items-center gap-1 px-2 hover:bg-red-500/25"
                        title="Confirm remove"
                      >
                        <Check className="h-3 w-3" /> Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingRemove(null)}
                        className="flex h-full items-center px-1.5 hover:bg-red-500/10"
                        title="Cancel"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingRemove(p);
                      }}
                      className="flex items-center border-l border-current/15 px-1.5 opacity-0 transition-opacity hover:bg-red-500/15 hover:text-red-600 focus-visible:opacity-100 group-hover/pill:opacity-100 dark:hover:text-red-300"
                      title="Remove from recent"
                      aria-label={`Remove ${p}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
