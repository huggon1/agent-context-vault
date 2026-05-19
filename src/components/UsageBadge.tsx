import { UsageMode } from "../lib/types";
import { Badge } from "./ui/badge";

export function UsageBadge({ usage, label }: { usage: UsageMode; label: string }) {
  return <Badge variant={usage}>{label}</Badge>;
}
