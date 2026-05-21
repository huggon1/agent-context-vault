import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { CopyButton } from "./CopyButton";
import { AgentBadges } from "./AgentBadges";
import { formatRelative, formatDate } from "../lib/time";
import type { Prompt } from "../lib/types";

interface Props {
  prompt: Prompt;
  onOpen: () => void;
}

export function PromptCard({ prompt, onOpen }: Props) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-2">
        <button type="button" onClick={onOpen} className="text-left">
          <h3 className="line-clamp-2 text-base font-semibold hover:underline">{prompt.title}</h3>
        </button>
        <p className="line-clamp-3 text-sm text-muted-foreground">{prompt.description}</p>
      </CardHeader>
      <CardContent className="mt-auto space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <AgentBadges agents={prompt.agents} />
          <span title={prompt.updatedAt}>Updated {formatRelative(prompt.updatedAt) || formatDate(prompt.updatedAt)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton value={prompt.promptContent} label="Copy prompt" copiedLabel="Copied" />
          <Button type="button" size="sm" variant="ghost" onClick={onOpen}>
            View details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
