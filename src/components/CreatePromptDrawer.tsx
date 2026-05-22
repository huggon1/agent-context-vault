import * as React from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { PromptEditor } from "./PromptEditor";
import { assemblePrompt, isValidSlug, titleToSlug } from "../lib/parseAsset";
import type { PromptFields } from "../lib/parseAsset";
import { useLibrary } from "../context/LibraryContext";
import { useToast } from "./ui/toast";
import { saveAsset } from "../api/client";

const EMPTY: PromptFields = { title: "", description: "", agents: ["all"], copyContent: "", descriptionBody: "" };

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreatePromptDrawer({ open, onClose }: Props) {
  const { library, refresh } = useLibrary();
  const { toast } = useToast();
  const [fields, setFields] = React.useState<PromptFields>(EMPTY);
  const [slug, setSlug] = React.useState("");
  const [slugDerived, setSlugDerived] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setFields(EMPTY);
      setSlug("");
      setSlugDerived(true);
      setError("");
    }
  }, [open]);

  async function handleSave() {
    setError("");
    if (!fields.title.trim()) { setError("Title is required."); return; }
    if (!isValidSlug(slug)) { setError("A valid slug is required."); return; }
    const exists = library?.prompts.some((p) => p.slug === slug);
    if (exists) { setError(`A prompt with slug "${slug}" already exists.`); return; }
    if (!fields.copyContent.trim()) { setError("Prompt content cannot be empty."); return; }

    setSaving(true);
    try {
      await saveAsset("prompt", slug, assemblePrompt(fields));
      await refresh();
      toast({ title: `Created "${fields.title}"` });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 animate-fade-in bg-background/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 m-0 flex h-full w-full max-w-2xl animate-in-right flex-col overflow-hidden border-l border-border/60 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/50 shadow-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />

        <div className="relative flex items-center justify-between gap-3 border-b border-border/60 p-6">
          <h2 className="text-xl font-semibold tracking-tight">New Prompt</h2>
          <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative flex-1 overflow-y-auto px-6 py-5">
          <PromptEditor
            fields={fields}
            onChange={setFields}
            disabled={saving}
            slugField={{
              value: slug,
              onChange: setSlug,
              derived: slugDerived,
              onBreakDerivation: () => setSlugDerived(false),
            }}
          />
        </div>

        {error && (
          <div className="border-t border-red-500/30 bg-red-500/10 px-6 py-2.5 text-xs text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-border/60 px-6 py-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={saving || !isValidSlug(slug)}>
            {saving ? "Creating…" : "Create Prompt"}
          </Button>
        </div>
      </div>
    </div>
  );
}
