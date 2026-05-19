import { Asset, AssetType, UsageMode } from "./types";
import { encodeAssetId, firstMeaningfulLine, titleFromName } from "./utils";

type Frontmatter = {
  title?: unknown;
  description?: unknown;
  tags?: unknown;
  scenarios?: unknown;
  install?: unknown;
  requires?: unknown;
  usage?: unknown;
  usageLabel?: unknown;
  usageDescription?: unknown;
};

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function toOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseInlineArray(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    return undefined;
  }

  return trimmed
    .slice(1, -1)
    .split(",")
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

function parseFrontmatter(markdown: string): { data: Frontmatter; content: string } {
  const normalized = markdown.replace(/^\uFEFF/, "");
  if (!normalized.startsWith("---")) {
    return { data: {}, content: markdown.trim() };
  }

  const lines = normalized.split(/\r?\n/);
  if (lines[0].trim() !== "---") {
    return { data: {}, content: markdown.trim() };
  }

  const closeIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (closeIndex === -1) {
    throw new Error("Missing closing frontmatter delimiter");
  }

  const frontmatterLines = lines.slice(1, closeIndex);
  const data: Record<string, unknown> = {};

  for (let index = 0; index < frontmatterLines.length; index += 1) {
    const line = frontmatterLines[index];
    if (!line.trim() || /^\s/.test(line)) {
      continue;
    }

    const match = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    const value = rawValue.trim();

    if (value === "|") {
      const block: string[] = [];
      while (index + 1 < frontmatterLines.length) {
        const nextLine = frontmatterLines[index + 1];
        if (/^[A-Za-z][\w-]*:\s*/.test(nextLine)) {
          break;
        }
        block.push(nextLine.replace(/^ {2}/, ""));
        index += 1;
      }
      data[key] = block.join("\n").trimEnd();
      continue;
    }

    const inlineArray = parseInlineArray(value);
    if (inlineArray) {
      data[key] = inlineArray;
      continue;
    }

    if (value === "") {
      const list: string[] = [];
      while (index + 1 < frontmatterLines.length) {
        const nextLine = frontmatterLines[index + 1];
        const listMatch = nextLine.match(/^\s*-\s+(.+)$/);
        if (!listMatch) {
          break;
        }
        list.push(listMatch[1].trim().replace(/^['"]|['"]$/g, ""));
        index += 1;
      }
      data[key] = list;
      continue;
    }

    data[key] = value.replace(/^['"]|['"]$/g, "");
  }

  return {
    data,
    content: lines.slice(closeIndex + 1).join("\n").trim(),
  };
}

function normalizeUsage(value: unknown, type: AssetType, install?: string): UsageMode {
  if (value === "copy" || value === "files" || value === "command") {
    return value;
  }

  if (install) {
    return "command";
  }

  if (type === "prompt") {
    return "copy";
  }

  return "files";
}

function defaultUsageLabel(usage: UsageMode) {
  switch (usage) {
    case "copy":
      return "Copy";
    case "files":
      return "Files";
    case "command":
      return "Command";
  }
}

function defaultUsageDescription(usage: UsageMode, type: AssetType) {
  switch (usage) {
    case "copy":
      return "Copy the body content and paste it into an agent or workflow.";
    case "files":
      return type === "skill"
        ? "Reference or copy the bundled files into the target agent environment."
        : "Copy or adapt the bundled files and configuration into the target project.";
    case "command":
      return "Run the install or launch command, then follow the documented workflow.";
  }
}

export function parseAssetMarkdown(params: {
  type: AssetType;
  markdown: string;
  relativePath: string;
  resourcePaths?: string[];
  sourceName: string;
}): Asset {
  const { type, markdown, relativePath, resourcePaths = [], sourceName } = params;
  let data: Frontmatter = {};
  let content = markdown;
  let parseError: string | undefined;

  try {
    const parsed = parseFrontmatter(markdown);
    data = parsed.data as Frontmatter;
    content = parsed.content;
  } catch (error) {
    parseError = error instanceof Error ? error.message : "Unknown frontmatter parse error";
    content = markdown.trim();
  }

  const title = toOptionalString(data.title) ?? titleFromName(sourceName);
  const description = toOptionalString(data.description) ?? firstMeaningfulLine(content);
  const install = toOptionalString(data.install);
  const usage = normalizeUsage(data.usage, type, install);

  return {
    id: encodeAssetId(type, relativePath),
    type,
    usage,
    usageLabel: toOptionalString(data.usageLabel) ?? defaultUsageLabel(usage),
    usageDescription: toOptionalString(data.usageDescription) ?? defaultUsageDescription(usage, type),
    title,
    description,
    tags: toStringArray(data.tags),
    scenarios: toStringArray(data.scenarios),
    install,
    requires: toStringArray(data.requires),
    content,
    relativePath,
    resourcePaths,
    sourceName,
    parseError,
  };
}
