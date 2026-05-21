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
      <div
        className="absolute inset-0 animate-fade-in bg-background/40 backdrop-blur-sm"
        onClick={onClose}
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
          <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {promptContent ? (
          <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-6 py-2.5 text-xs">
            <span className="text-muted-foreground">Prompt body ready to copy</span>
            <CopyButton value={promptContent} label="Copy prompt" copiedLabel="Copied" />
          </div>
        ) : null}

        <div className="relative flex-1 overflow-y-auto px-6 py-5">
          <MarkdownRenderer content={body} />
        </div>
      </div>
    </div>
  );
}
