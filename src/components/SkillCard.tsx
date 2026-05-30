import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { formatRelative, formatDate } from "../lib/time";
import type { Skill } from "../lib/types";

interface Props {
  skill: Skill;
  onOpen: () => void;
}

export function SkillCard({ skill, onOpen }: Props) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <button
          type="button"
          onClick={onOpen}
          className="group/title -m-1 inline-flex items-start gap-1 rounded p-1 text-left"
        >
          <h3 className="line-clamp-2 text-base font-semibold tracking-tight group-hover/title:text-primary">
            {skill.name}
          </h3>
          <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover/title:translate-x-0.5 group-hover/title:-translate-y-0.5 group-hover/title:opacity-100 group-hover/title:text-primary" />
        </button>
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{skill.description}</p>
      </CardHeader>
      <CardContent className="mt-auto space-y-4">
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span title={skill.updatedAt}>
            {formatRelative(skill.updatedAt) || formatDate(skill.updatedAt)}
          </span>
        </div>
        <div className="flex">
          <Button type="button" size="sm" variant="ghost" onClick={onOpen} className="ml-auto">
            View details <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
