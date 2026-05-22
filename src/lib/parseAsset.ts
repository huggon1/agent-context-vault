const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const LEGACY_COPY_END_RE = /\n<!-- copy:end -->\n[\s\S]*$/;

function parseScalar(raw: string): string | string[] {
  const t = raw.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  if (t.startsWith("[") && t.endsWith("]")) {
    const inner = t.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  }
  return t;
}

function parseFrontmatter(source: string): { data: Record<string, string | string[]>; body: string } {
  const match = source.match(FRONTMATTER_RE);
  if (!match) return { data: {}, body: source };
  const yaml = match[1];
  const body = source.slice(match[0].length);
  const data: Record<string, string | string[]> = {};
  const lines = yaml.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const [, key, rest] = m;
    if (rest.trim() === "") {
      const items: string[] = [];
      let j = i + 1;
      while (j < lines.length && /^\s+-\s+/.test(lines[j])) {
        items.push(lines[j].replace(/^\s+-\s+/, "").trim());
        j++;
      }
      if (items.length > 0) { data[key] = items; i = j - 1; continue; }
      data[key] = "";
      continue;
    }
    data[key] = parseScalar(rest);
  }
  return { data, body };
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

export interface PromptFields {
  title: string;
  description: string;
  copyContent: string;
}

export function parsePromptRaw(raw: string): PromptFields {
  const { data, body } = parseFrontmatter(raw);
  const title = typeof data.title === "string" ? data.title : "";
  const description = typeof data.description === "string" ? data.description : "";
  const copyContent = body.replace(LEGACY_COPY_END_RE, "").trim();
  return { title, description, copyContent };
}

export function assemblePrompt(fields: PromptFields): string {
  const { title, description, copyContent } = fields;
  const frontmatter = `---\ntitle: ${title}\ndescription: ${description}\n---\n`;
  return `${frontmatter}\n${copyContent.trim()}\n`;
}

// ---------------------------------------------------------------------------
// Slug
// ---------------------------------------------------------------------------

export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function isValidSlug(s: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/.test(s);
}
