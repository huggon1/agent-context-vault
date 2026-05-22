const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const COPY_END_MARKER = "\n<!-- copy:end -->\n";

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

function splitPromptBody(body: string): { copyContent: string; descriptionBody: string } {
  const idx = body.indexOf(COPY_END_MARKER);
  if (idx === -1) return { copyContent: body, descriptionBody: "" };
  const copyContent = body.slice(0, idx + 1);
  const descriptionBody = body.slice(idx + COPY_END_MARKER.length);
  return { copyContent, descriptionBody };
}

function parseAgents(raw: string | string[] | undefined): string[] {
  if (Array.isArray(raw)) return raw.length > 0 ? raw : ["all"];
  if (typeof raw === "string" && raw.trim()) return [raw.trim()];
  return ["all"];
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

export interface PromptFields {
  title: string;
  description: string;
  agents: string[];
  copyContent: string;
  descriptionBody: string;
}

export function parsePromptRaw(raw: string): PromptFields {
  const { data, body } = parseFrontmatter(raw);
  const title = typeof data.title === "string" ? data.title : "";
  const description = typeof data.description === "string" ? data.description : "";
  const agents = parseAgents(data.agents);
  const { copyContent, descriptionBody } = splitPromptBody(body);
  return { title, description, agents, copyContent: copyContent.trim(), descriptionBody: descriptionBody.trim() };
}

function formatAgents(agents: string[]): string {
  const filtered = agents.filter((a) => a !== "all");
  if (filtered.length === 0) return "";
  if (filtered.length === 1) return `agents: ${filtered[0]}\n`;
  return `agents: [${filtered.join(", ")}]\n`;
}

export function assemblePrompt(fields: PromptFields): string {
  const { title, description, agents, copyContent, descriptionBody } = fields;
  const agentLine = formatAgents(agents);
  const frontmatter = `---\ntitle: ${title}\ndescription: ${description}\n${agentLine}---\n`;
  const copy = copyContent.trimEnd();
  const desc = descriptionBody.trim();
  if (desc) {
    return `${frontmatter}\n${copy}\n${COPY_END_MARKER}\n${desc}\n`;
  }
  return `${frontmatter}\n${copy}\n`;
}

// ---------------------------------------------------------------------------
// Skill README
// ---------------------------------------------------------------------------

export interface SkillReadmeFields {
  title: string;
  description: string;
  agents: string[];
  body: string;
}

export function parseSkillReadmeRaw(raw: string): SkillReadmeFields {
  const { data, body } = parseFrontmatter(raw);
  const title = typeof data.title === "string" ? data.title : "";
  const description = typeof data.description === "string" ? data.description : "";
  const agents = parseAgents(data.agents);
  return { title, description, agents, body: body.trim() };
}

export function assembleSkillReadme(fields: SkillReadmeFields): string {
  const { title, description, agents, body } = fields;
  const agentLine = formatAgents(agents);
  const frontmatter = `---\ntitle: ${title}\ndescription: ${description}\n${agentLine}---\n`;
  return body.trim() ? `${frontmatter}\n${body.trim()}\n` : frontmatter;
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
