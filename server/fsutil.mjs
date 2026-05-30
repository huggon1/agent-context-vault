import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function readDirSafe(dir, { type = 'dir' } = {}) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    if (type === 'dir') return entries.filter((e) => e.isDirectory()).map((e) => e.name);
    if (type === 'md') return entries.filter((e) => e.isFile() && e.name.endsWith('.md')).map((e) => e.name.slice(0, -3));
    return entries.map((e) => e.name);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(s, d);
    } else if (entry.isFile()) {
      await fs.copyFile(s, d);
    }
  }
}
