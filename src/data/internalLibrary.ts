import { parseAssetMarkdown } from "../lib/parser";
import { Asset } from "../lib/types";
import { generatedLibraryName, generatedLibrarySources } from "./generatedLibrary";

export const internalLibraryName = generatedLibraryName;

export function loadInternalLibrary(): Asset[] {
  return generatedLibrarySources
    .map((source) =>
      parseAssetMarkdown({
        type: source.type,
        markdown: source.markdown,
        relativePath: source.relativePath,
        resourcePaths: "resourcePaths" in source ? [...source.resourcePaths] : [],
        sourceName: source.sourceName,
      }),
    )
    .sort((a, b) => a.title.localeCompare(b.title));
}
