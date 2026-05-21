import { Badge } from "./ui/badge";

const LABELS: Record<string, string> = {
  "claude-code": "Claude Code",
  codex: "Codex",
  all: "All agents",
};

export function AgentBadges({ agents }: { agents: string[] }) {
  if (!agents || agents.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {agents.map((a) => (
        <Badge key={a} variant="outline" className="text-[10px] uppercase tracking-wide">
          {LABELS[a] ?? a}
        </Badge>
      ))}
    </div>
  );
}
