import { ArrowLeft, AlertCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { CopyButton } from "../components/CopyButton";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { ThemeToggle } from "../components/ThemeToggle";
import { UsageBadge } from "../components/UsageBadge";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useLibrary } from "../context/LibraryContext";
import { safeDecodeAssetId } from "../lib/utils";

export default function Detail() {
  const { id } = useParams();
  const { assets } = useLibrary();
  const asset = assets.find((item) => item.id === id);
  const decodedId = id ? safeDecodeAssetId(id) : undefined;

  if (!asset) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <Card className="p-6">
            <h1 className="text-lg font-semibold tracking-normal">Asset not loaded</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose or restore a library on the home page, then open this asset again.
            </p>
            {decodedId ? <p className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">{decodedId}</p> : null}
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="border-b pb-7">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <UsageBadge usage={asset.usage} label={asset.usageLabel} />
            <span className="text-sm text-muted-foreground">{asset.relativePath}</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal">{asset.title}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{asset.description}</p>
          {asset.parseError ? (
            <div className="mt-4 flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>Frontmatter could not be parsed: {asset.parseError}. Raw markdown is still shown.</div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 py-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4">
            <Card className="p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</div>
              <div className="mt-3 space-y-2">
                {asset.usage === "copy" ? (
                  <CopyButton value={asset.content} label="Copy Content" copiedLabel="Content Copied" className="w-full" />
                ) : null}
                {asset.usage === "files" ? (
                  <CopyButton
                    value={asset.relativePath}
                    label="Copy Entry Path"
                    copiedLabel="Path Copied"
                    className="w-full"
                  />
                ) : null}
                {asset.usage === "command" && asset.install ? (
                  <CopyButton
                    value={asset.install}
                    label="Copy Install Command"
                    copiedLabel="Install Copied"
                    className="w-full"
                  />
                ) : null}
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Usage</div>
              <div className="mt-3 rounded-md border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
                {asset.usageDescription}
              </div>
              {asset.scenarios.length > 0 ? (
                <div className="mt-4">
                  <div className="mb-2 text-sm font-medium">Use cases</div>
                  <ul className="space-y-1 text-sm leading-6 text-muted-foreground">
                    {asset.scenarios.map((scenario) => (
                      <li key={scenario}>{scenario}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {asset.tags.length > 0 ? (
                <div className="mt-4">
                  <div className="mb-2 text-sm font-medium">Key tags</div>
                  <div className="flex flex-wrap gap-2">
                    {asset.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {asset.requires.length > 0 ? (
                <div className="mt-4">
                  <div className="mb-2 text-sm font-medium">Requires</div>
                  <ul className="space-y-1 text-sm leading-6 text-muted-foreground">
                    {asset.requires.map((requirement) => (
                      <li key={requirement}>{requirement}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {asset.resourcePaths.length > 0 ? (
                <div className="mt-4">
                  <div className="mb-2 text-sm font-medium">Bundled files</div>
                  <ul className="space-y-1 text-sm leading-6 text-muted-foreground">
                    {asset.resourcePaths.map((path) => (
                      <li key={path} className="break-all">
                        {path}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {asset.tags.length === 0 &&
              asset.scenarios.length === 0 &&
              asset.requires.length === 0 &&
              asset.resourcePaths.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No metadata provided.</p>
              ) : null}
            </Card>
          </aside>

          <section className="min-w-0">
            {asset.usage === "command" && asset.install ? (
              <Card className="mb-6 overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                  <div className="text-sm font-medium">Install</div>
                  <CopyButton value={asset.install} label="Copy" copiedLabel="Copied" size="sm" />
                </div>
                <pre className="overflow-x-auto bg-muted/40 p-4 text-sm">
                  <code>{asset.install}</code>
                </pre>
              </Card>
            ) : null}
            <Card className="p-5 sm:p-7">
              <MarkdownRenderer content={asset.content || "_No body content provided._"} />
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
