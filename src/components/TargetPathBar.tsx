import * as React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useTargetPath } from "../context/TargetPathContext";

export function TargetPathBar() {
  const { currentPath, recentPaths, setCurrentPath } = useTargetPath();
  const [value, setValue] = React.useState(currentPath);

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

  return (
    <div className="border-b bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <FolderOpen className="h-4 w-4" />
          Target project path
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="/absolute/path/to/your/project"
            onKeyDown={(e) => {
              if (e.key === "Enter") void apply(value);
            }}
            className="md:max-w-2xl"
          />
          <div className="flex gap-2">
            <Button type="button" onClick={() => void apply(value)}>
              Apply
            </Button>
          </div>
        </div>
        {recentPaths.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Recent:</span>
            {recentPaths.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => void apply(p)}
                className={`rounded-md border px-2 py-1 font-mono transition-colors hover:bg-accent ${
                  p === currentPath ? "border-primary text-primary" : ""
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
