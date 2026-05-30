import * as React from "react";
import { X, Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { CopyButton } from "./CopyButton";
import { formatDate, formatRelative } from "../lib/time";
import { useToast } from "./ui/toast";
import { useLibrary } from "../context/LibraryContext";
import { useProjects } from "../context/ProjectsContext";
import { fetchAssetRaw, saveAsset, renameSkill, deleteSkill, fetchSkillInstalls } from "../api/client";
import { PromptEditor } from "./PromptEditor";
import { parsePromptRaw, assemblePrompt, isValidSlug } from "../lib/parseAsset";
import type { PromptFields } from "../lib/parseAsset";
import type { SkillInstall } from "../lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  slug: string;
  assetType: "skill" | "prompt";
  title: string;
  description: string;
  updatedAt: string;
  body: string;
  promptContent?: string;
  onSlugChange?: (newSlug: string) => void;
}

export function DetailDrawer({
  open,
  onClose,
  slug,
  assetType,
  title,
  description,
  updatedAt,
  body,
  promptContent,
  onSlugChange,
}: Props) {
  const { toast } = useToast();
  const { refresh } = useLibrary();
  const { projects } = useProjects();
  const [editFields, setEditFields] = React.useState<PromptFields | null>(null);
  const [renameValue, setRenameValue] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [installs, setInstalls] = React.useState<SkillInstall[] | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const editingPrompt = editFields !== null;
  const renaming = renameValue !== null;
  const busy = editingPrompt || renaming;

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (editingPrompt) setEditFields(null);
        else if (renaming) setRenameValue(null);
        else onClose();
      }
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, editingPrompt, renaming]);

  React.useEffect(() => {
    if (!open) {
      setEditFields(null);
      setRenameValue(null);
    }
  }, [open, slug]);

  React.useEffect(() => {
    if (open && assetType === "skill" && slug) {
      setInstalls(null);
      fetchSkillInstalls(slug)
        .then(({ installs }) => setInstalls(installs))
        .catch(() => setInstalls([]));
    }
  }, [open, assetType, slug]);

  async function handleEditPrompt() {
    try {
      const { content } = await fetchAssetRaw("prompt", slug);
      setEditFields(parsePromptRaw(content));
    } catch {
      toast({ title: "Could not load file for editing" });
    }
  }

  async function handleSavePrompt() {
    if (!editFields) return;
    setSaving(true);
    try {
      await saveAsset("prompt", slug, assemblePrompt(editFields));
      await refresh();
      setEditFields(null);
      toast({ title: "Saved" });
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveRename() {
    if (renameValue === null) return;
    const newSlug = renameValue.trim();
    if (!isValidSlug(newSlug)) {
      toast({ title: "Invalid slug", description: "Use lowercase letters, digits, and hyphens." });
      return;
    }
    if (newSlug === slug) {
      setRenameValue(null);
      return;
    }
    setSaving(true);
    try {
      await renameSkill(slug, newSlug);
      await refresh();
      setRenameValue(null);
      toast({ title: `Renamed to ${newSlug}` });
      if (onSlugChange) onSlugChange(newSlug);
      else onClose();
    } catch (err) {
      const e = err as Error & { status?: number; code?: string };
      if (e.code === "installed") {
        toast({ title: "Cannot rename", description: "Uninstall this skill before renaming." });
      } else if (e.code === "slug_exists") {
        toast({ title: "Slug already taken" });
      } else {
        toast({ title: "Rename failed", description: e.message });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete skill "${title}" from the vault? This removes the source; installed copies are left in place.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      let res = await deleteSkill(slug);
      if (!res.ok && res.error === "installed") {
        const n = res.installs?.length ?? 0;
        if (
          !window.confirm(
            `"${slug}" is installed in ${n} place(s). Delete the source anyway? Installed copies remain.`,
          )
        ) {
          setDeleting(false);
          return;
        }
        res = await deleteSkill(slug, true);
      }
      if (!res.ok) {
        toast({ title: "Delete failed", description: res.error ?? "Unknown error" });
        return;
      }
      await refresh();
      toast({ title: `Deleted ${slug}` });
      onClose();
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : String(err) });
    } finally {
      setDeleting(false);
    }
  }

  if (!open) return null;

  const isSkill = assetType === "skill";
  const hasBody = body.trim().length > 0;
  const renameInvalid = renameValue !== null && renameValue.trim() !== slug && !isValidSlug(renameValue.trim());

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 animate-fade-in bg-background/40 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
        aria-hidden
      />
      <div className="relative z-10 m-0 flex h-full w-full max-w-2xl animate-in-right flex-col overflow-hidden border-l border-border/60 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/50 shadow-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />

        {isSkill ? (
          <div className="relative flex items-center justify-between gap-3 border-b border-border/60 px-6 py-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono text-[11px]">{slug}</span>
              <span className="text-muted-foreground/70">·</span>
              <span title={updatedAt}>
                Updated {formatRelative(updatedAt) || formatDate(updatedAt)}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!renaming && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setRenameValue(slug)}
                  aria-label="Rename"
                  title="Rename skill"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {!renaming && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={deleting}
                  aria-label="Delete skill"
                  title="Delete skill"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative flex items-start justify-between gap-3 border-b border-border/60 p-6">
            <div className="min-w-0 space-y-2">
              <h2 className="truncate text-xl font-semibold tracking-tight">
                {editingPrompt && editFields ? editFields.title || title : title}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {editingPrompt && editFields ? editFields.description || description : description}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                <span title={updatedAt}>
                  Updated {formatRelative(updatedAt) || formatDate(updatedAt)}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!editingPrompt && (
                <Button type="button" size="icon" variant="ghost" onClick={handleEditPrompt} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {isSkill && renaming ? (
          <div className="relative flex flex-col gap-2 border-b border-border/60 bg-muted/30 px-6 py-3">
            <label className="text-xs text-muted-foreground">Rename skill (slug + name)</label>
            <div className="flex items-center gap-2">
              <Input
                value={renameValue ?? ""}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="new-slug"
                disabled={saving}
                autoFocus
                className={`font-mono text-sm ${renameInvalid ? "border-red-500/60 focus-visible:ring-red-500/20" : ""}`}
              />
              <Button type="button" size="sm" variant="ghost" onClick={() => setRenameValue(null)} disabled={saving}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveRename}
                disabled={saving || renameInvalid || !renameValue?.trim()}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
            {renameInvalid && (
              <p className="text-xs text-red-500">Slug must be lowercase letters, digits, and hyphens.</p>
            )}
          </div>
        ) : null}

        {isSkill && !renaming ? (
          <div className="relative border-b border-border/60 bg-muted/20 px-6 py-2.5 text-xs">
            {installs === null ? (
              <span className="text-muted-foreground">Checking installs…</span>
            ) : installs.length === 0 ? (
              <span className="text-muted-foreground">Not installed in any project.</span>
            ) : (
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground">Installed in {installs.length} place(s):</span>
                <div className="flex flex-wrap gap-1.5">
                  {installs.map((i) => {
                    const name = projects.find((p) => p.id === i.projectId)?.name ?? i.projectId;
                    return (
                      <span
                        key={`${i.projectId}:${i.agent}`}
                        className="rounded-full border border-border/60 px-2 py-0.5"
                      >
                        {name} · {i.agent === "claude-code" ? ".claude" : ".codex"} · {i.status}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {!isSkill && !editingPrompt && promptContent ? (
          <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-6 py-2.5 text-xs">
            <span className="text-muted-foreground">Prompt body ready to copy</span>
            <CopyButton value={promptContent} label="Copy prompt" copiedLabel="Copied" />
          </div>
        ) : null}

        <div className="relative flex-1 overflow-y-auto px-6 py-5">
          {editingPrompt && editFields ? (
            <div className="flex flex-col gap-4">
              <PromptEditor
                fields={editFields}
                onChange={setEditFields}
                disabled={saving}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditFields(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={handleSavePrompt} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          ) : isSkill ? (
            hasBody ? (
              <MarkdownRenderer content={body} />
            ) : (
              <p className="text-sm text-muted-foreground">No documentation available.</p>
            )
          ) : promptContent ? (
            <pre className="whitespace-pre-wrap break-words rounded-md border border-border/60 bg-muted/30 p-4 font-mono text-sm leading-relaxed text-foreground">
              {promptContent}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">No prompt content.</p>
          )}
        </div>
      </div>
    </div>
  );
}
