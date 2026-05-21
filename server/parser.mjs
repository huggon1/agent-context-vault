const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function parseScalar(raw) {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    return inner
      .split(',')
      .map((item) => item.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }
  return trimmed;
}

export function parseFrontmatter(source) {
  const match = source.match(FRONTMATTER_RE);
  if (!match) {
    return { data: {}, body: source };
  }
  const yaml = match[1];
  const body = source.slice(match[0].length);
  const data = {};
  const lines = yaml.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const [, key, rest] = m;
    if (rest.trim() === '') {
      // Could be a list or block scalar that follows on subsequent indented lines
      const items = [];
      let j = i + 1;
      while (j < lines.length && /^\s+-\s+/.test(lines[j])) {
        items.push(lines[j].replace(/^\s+-\s+/, '').trim());
        j++;
      }
      if (items.length > 0) {
        data[key] = items;
        i = j - 1;
        continue;
      }
      data[key] = '';
      continue;
    }
    data[key] = parseScalar(rest);
  }
  return { data, body };
}
