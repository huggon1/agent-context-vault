import { Badge } from "./ui/badge";

export function FilterBar({
  selectedTags,
  tags,
  onToggleTag,
  onClearTags,
}: {
  selectedTags: string[];
  tags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
}) {
  return (
    <aside className="rounded-lg border bg-card p-4">
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags</div>
          {selectedTags.length > 0 ? (
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={onClearTags}>
              Clear
            </button>
          ) : null}
        </div>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button key={tag} type="button" onClick={() => onToggleTag(tag)}>
                  <Badge variant={active ? "default" : "outline"} className="cursor-pointer">
                    {tag}
                  </Badge>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No tags found.</p>
        )}
      </div>
    </aside>
  );
}
