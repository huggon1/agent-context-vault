import * as React from "react";
import { Download, X, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useLibrary } from "../context/LibraryContext";
import { useToast } from "./ui/toast";
import { importSkill } from "../api/client";

type PanelState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "confirm"; slug: string; url: string };

const IDLE: PanelState = { phase: "idle" };

interface Props {
  onClose: () => void;
}

export function ImportPanel({ onClose }: Props) {
  const { refresh } = useLibrary();
  const { toast } = useToast();
  const [url, setUrl] = React.useState("");
  const [state, setState] = React.useState<PanelState>(IDLE);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function doImport(importUrl: string, force = false) {
    setState({ phase: "loading" });
    try {
      const result = await importSkill(importUrl, force);
      await refresh();
      toast({ title: `Imported "${result.slug}"`, description: "Skill added to your library." });
      setUrl("");
      setState(IDLE);
      onClose();
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === "skill_exists") {
        const slug = (e as any).slug ?? importUrl.split("/").filter(Boolean).at(-1) ?? "skill";
        setState({ phase: "confirm", slug, url: importUrl });
      } else {
        setState({ phase: "error", message: e.message ?? "Import failed." });
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state.phase === "loading") return;
    void doImport(url.trim());
  }

  const isLoading = state.phase === "loading";

  return (
    <div className="glass rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Download className="h-3.5 w-3.5" />
        </span>
        <span className="text-sm font-medium">Import from GitHub</span>
        <button
          type="button"
          aria-label="Close import panel"
          onClick={onClose}
          className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Input
            ref={inputRef}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (state.phase === "error") setState(IDLE);
            }}
            placeholder="https://github.com/owner/repo/tree/main/skills/my-skill"
            disabled={isLoading}
            className="font-mono text-xs md:flex-1"
          />
          <Button type="submit" size="sm" disabled={isLoading || !url.trim()}>
            <Download className="h-3.5 w-3.5" />
            {isLoading ? "Importing…" : "Import"}
          </Button>
        </div>

        {state.phase === "error" && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{state.message}</span>
          </div>
        )}

        {state.phase === "confirm" && (
          <div className="flex flex-col gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Skill <span className="font-mono font-semibold">{state.slug}</span> already exists in your library. Overwrite it?
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => void doImport(state.url, true)}
              >
                Overwrite
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setState(IDLE)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
