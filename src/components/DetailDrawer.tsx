import * as React from "react";
import { X, Pencil } from "lucide-react";
import { Button } from "./ui/button";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { CopyButton } from "./CopyButton";
import { AgentBadges } from "./AgentBadges";
import { formatDate, formatRelative } from "../lib/time";
import { useToast } from "./ui/toast";
import { useLibrary } from "../context/LibraryContext";
import { fetchAssetRaw, saveAsset } from "../api/client";

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
  const [editing, setEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (editing) {
          setEditing(false);
        } else {
          onClose();
        }
      }
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, editing]);

  // Reset edit state when drawer closes or switches asset
  React.useEffect(() => {
    if (!open) setEditing(false);
  }, [open, slug]);

  async function handleEdit() {
    try {
      const { content } = await fetchAssetRaw(assetType, slug);
      setEditContent(content);
      setEditing(true);
    } catch {
      toast({ title: "Could not load file for editing" });
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveAsset(assetType, slug, editContent);
      await refresh();
      setEditing(false);
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
            <h2 className="truncate text-xl font-semibold tracking-tight">{title}</h2>
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
            <div className="flex h-full flex-col gap-3">
              <textarea
                className="flex-1 resize-none rounded-md border border-border bg-muted/40 p-3 font-mono text-sm leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-ring"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                spellCheck={false}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          ) : hasBody ? (
            <MarkdownRenderer content={body} />
          ) : (
            <p className="text-sm text-muted-foreground">No documentation available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
