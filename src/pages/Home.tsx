import * as React from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { AppHeader } from "../components/AppHeader";
import { AssetCard } from "../components/AssetCard";
import { FilterBar } from "../components/FilterBar";
import { useLibrary } from "../context/LibraryContext";

function normalize(value: string) {
  return value.toLowerCase();
}

export default function Home() {
  const {
    assets,
    errors,
    status,
    rootPathLabel,
    message,
  } = useLibrary();
  const [search, setSearch] = React.useState("");
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  const tags = React.useMemo(
    () => Array.from(new Set(assets.flatMap((asset) => asset.tags))).sort((a, b) => a.localeCompare(b)),
    [assets],
  );

  const filteredAssets = React.useMemo(() => {
    const query = normalize(search.trim());
    return assets.filter((asset) => {
      if (selectedTags.length > 0 && !selectedTags.every((tag) => asset.tags.includes(tag))) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = normalize(
        [
          asset.title,
          asset.description,
          asset.tags.join(" "),
          asset.scenarios.join(" "),
          asset.requires.join(" "),
          asset.content.slice(0, 1000),
        ].join(" "),
      );
      return haystack.includes(query);
    });
  }, [assets, search, selectedTags]);

  function toggleTag(tag: string) {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        rootPathLabel={rootPathLabel}
        search={search}
        onSearchChange={setSearch}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {status === "loading" ? (
          <div className="flex min-h-[420px] items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading library...
          </div>
        ) : status === "error" && assets.length === 0 ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-6 py-12 text-center text-destructive">
            <h2 className="text-base font-semibold tracking-normal">Unable to load the internal library</h2>
            <p className="mt-2 text-sm">{message ?? "Check the bundled library files and rebuild the app."}</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <FilterBar
              selectedTags={selectedTags}
              tags={tags}
              onToggleTag={toggleTag}
              onClearTags={() => setSelectedTags([])}
            />
            <section className="min-w-0">
              {errors.length > 0 ? (
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="h-4 w-4" />
                    Some files could not be loaded
                  </div>
                  <ul className="mt-2 space-y-1 text-xs">
                    {errors.slice(0, 3).map((error) => (
                      <li key={`${error.path}:${error.message}`}>
                        {error.path}: {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredAssets.length} of {assets.length} assets
                </p>
              </div>
              {assets.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center">
                  <h2 className="text-base font-semibold tracking-normal">No assets found</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    The internal library loaded, but no assets were available.
                  </p>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center">
                  <h2 className="text-base font-semibold tracking-normal">No matching assets</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Adjust the search or filters to see more results.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {filteredAssets.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
