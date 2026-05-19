import { Link } from "react-router-dom";
import { Asset } from "../lib/types";
import { UsageBadge } from "./UsageBadge";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

export function AssetCard({ asset }: { asset: Asset }) {
  const visibleTags = asset.tags.slice(0, 3);
  const hiddenTagCount = asset.tags.length - visibleTags.length;
  const visibleScenarios = asset.scenarios.slice(0, 2);
  const hasMoreScenarios = asset.scenarios.length > visibleScenarios.length;

  return (
    <Link to={`/asset/${asset.id}`} className="block h-full">
      <Card className="flex h-full min-h-[240px] flex-col p-5 transition hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <UsageBadge usage={asset.usage} label={asset.usageLabel} />
          <span className="truncate text-xs text-muted-foreground">{asset.relativePath}</span>
        </div>
        <div className="mt-5 flex-1">
          <h2 className="line-clamp-2 text-base font-semibold tracking-normal">{asset.title}</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{asset.description}</p>
          {asset.parseError ? (
            <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive">
              Parse warning: {asset.parseError}
            </p>
          ) : null}
        </div>
        <div className="mt-5 border-t pt-4">
          <div className="mb-2 text-xs font-medium text-muted-foreground">How to use</div>
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{asset.usageDescription}</p>
        </div>
        {asset.tags.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
            {hiddenTagCount > 0 ? <Badge variant="outline">+{hiddenTagCount}</Badge> : null}
          </div>
        ) : null}
        {visibleScenarios.length > 0 ? (
          <div className="mt-5 border-t pt-4">
            <div className="mb-2 text-xs font-medium text-muted-foreground">Use cases</div>
            <ul className="space-y-1 text-xs leading-5 text-muted-foreground">
              {visibleScenarios.map((scenario) => (
                <li key={scenario} className="line-clamp-1">
                  {scenario}
                </li>
              ))}
              {hasMoreScenarios ? <li>...</li> : null}
            </ul>
          </div>
        ) : null}
      </Card>
    </Link>
  );
}
