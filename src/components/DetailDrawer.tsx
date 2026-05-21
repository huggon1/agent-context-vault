import * as React from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { CopyButton } from "./CopyButton";
import { AgentBadges } from "./AgentBadges";
import { formatDate, formatRelative } from "../lib/time";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  agents: string[];
  updatedAt: string;
  body: string;
  promptContent?: string;
}

export function DetailDrawer({ open, onClose, title, description, agents, updatedAt, body, promptContent }: Props) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-background shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b p-5">
          <div className="min-w-0 space-y-1">
            <h2 className="truncate text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
              <AgentBadges agents={agents} />
              <span title={updatedAt}>Updated {formatRelative(updatedAt) || formatDate(updatedAt)}</span>
            </div>
          </div>
          <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {promptContent ? (
          <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-5 py-2 text-xs">
            <span className="text-muted-foreground">Prompt body ready to copy</span>
            <CopyButton value={promptContent} label="Copy prompt" copiedLabel="Copied" />
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <MarkdownRenderer content={body} />
        </div>
      </div>
    </div>
  );
}
