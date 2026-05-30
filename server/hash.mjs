import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export async function hashDir(dir) {
  const hash = crypto.createHash('sha256');
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        hash.update('D:' + path.relative(dir, full) + '\n');
        await walk(full);
      } else if (entry.isFile()) {
        const content = await fs.readFile(full);
        hash.update('F:' + path.relative(dir, full) + ':' + content.length + '\n');
        hash.update(content);
      }
    }
  }
  await walk(dir);
  return hash.digest('hex');
}
