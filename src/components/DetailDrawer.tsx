import * as React from "react";
import { X, Pencil, FilePlus } from "lucide-react";
import { Button } from "./ui/button";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { CopyButton } from "./CopyButton";
import { AgentBadges } from "./AgentBadges";
import { formatDate, formatRelative } from "../lib/time";
import { useToast } from "./ui/toast";
import { useLibrary } from "../context/LibraryContext";
import { fetchAssetRaw, saveAsset } from "../api/client";
import { PromptEditor } from "./PromptEditor";
import { SkillReadmeEditor } from "./SkillReadmeEditor";
import {
  parsePromptRaw,
  assemblePrompt,
  parseSkillReadmeRaw,
  assembleSkillReadme,
} from "../lib/parseAsset";
import type { PromptFields, SkillReadmeFields } from "../lib/parseAsset";

type EditState =
  | { kind: "skill"; fields: SkillReadmeFields }
  | { kind: "prompt"; fields: PromptFields };

interface Props {
  open: boolean;
  onClose: () => void;
  slug: string;
  assetType: "skill" | "prompt";
  title: string;
  description: string;
  agents: string[];
  updatedAt: string;
  body: string;
  promptContent?: string;
}

export function DetailDrawer({
  open,
  onClose,
  slug,
  assetType,
  title,
  description,
  agents,
  updatedAt,
  body,
  promptContent,
}: Props) {
  const { toast } = useToast();
  const { refresh } = useLibrary();
  const [editState, setEditState] = React.useState<EditState | null>(null);
  const [saving, setSaving] = React.useState(false);

  const editing = editState !== null;

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (editing) setEditState(null);
        else onClose();
      }
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, editing]);

  React.useEffect(() => {
    if (!open) setEditState(null);
  }, [open, slug]);

  async function handleEdit() {
    try {
      const { content } = await fetchAssetRaw(assetType, slug);
      if (assetType === "skill") {
        setEditState({ kind: "skill", fields: parseSkillReadmeRaw(content) });
      } else {
        setEditState({ kind: "prompt", fields: parsePromptRaw(content) });
      }
    } catch (err: unknown) {
      // 404 for skill means no README yet — start from card metadata
      if (assetType === "skill" && (err as { status?: number }).status === 404) {
        setEditState({ kind: "skill", fields: { title, description, agents, body: "" } });
      } else {
        toast({ title: "Could not load file for editing" });
      }
    }
  }

  function handleCreateReadme() {
    setEditState({ kind: "skill", fields: { title, description, agents, body: "" } });
  }

  async function handleSave() {
    if (!editState) return;
    setSaving(true);
    try {
      const content =
        editState.kind === "skill"
          ? assembleSkillReadme(editState.fields)
          : assemblePrompt(editState.fields);
      await saveAsset(assetType, slug, content);
      await refresh();
      setEditState(null);
      toast({ title: "Saved" });
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const hasBody = body.trim().length > 0;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 animate-fade-in bg-background/40 backdrop-blur-sm"
        onClick={editing ? undefined : onClose}
        aria-hidden
      />
      <div className="relative z-10 m-0 flex h-full w-full max-w-2xl animate-in-right flex-col overflow-hidden border-l border-border/60 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/50 shadow-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />

        <div className="relative flex items-start justify-between gap-3 border-b border-border/60 p-6">
          <div className="min-w-0 space-y-2">
            <h2 className="truncate text-xl font-semibold tracking-tight">
              {editing && editState?.kind === "skill" ? editState.fields.title || title : title}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              <AgentBadges agents={agents} />
              <span className="text-muted-foreground/70">·</span>
              <span title={updatedAt}>
                Updated {formatRelative(updatedAt) || formatDate(updatedAt)}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!editing && (
              <Button type="button" size="icon" variant="ghost" onClick={handleEdit} aria-label="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!editing && promptContent ? (
          <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-6 py-2.5 text-xs">
            <span className="text-muted-foreground">Prompt body ready to copy</span>
            <CopyButton value={promptContent} label="Copy prompt" copiedLabel="Copied" />
          </div>
        ) : null}

        <div className="relative flex-1 overflow-y-auto px-6 py-5">
          {editing ? (
            <div className="flex flex-col gap-4">
              {editState?.kind === "skill" && (
                <SkillReadmeEditor
                  fields={editState.fields}
                  onChange={(f) => setEditState({ kind: "skill", fields: f })}
                  disabled={saving}
                />
              )}
              {editState?.kind === "prompt" && (
                <PromptEditor
                  fields={editState.fields}
                  onChange={(f) => setEditState({ kind: "prompt", fields: f })}
                  disabled={saving}
                />
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditState(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          ) : hasBody ? (
            <MarkdownRenderer content={body} />
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">No documentation available.</p>
              {assetType === "skill" && (
                <Button type="button" size="sm" variant="outline" onClick={handleCreateReadme}>
                  <FilePlus className="h-3.5 w-3.5" />
                  Add README
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
