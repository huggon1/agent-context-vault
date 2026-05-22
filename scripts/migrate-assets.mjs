#!/usr/bin/env node
// One-time migration: restructure assets into new flat format
// Skills: move README.md outside the skill folder
// Prompts: merge README.md + prompt.md into a single <slug>.md file

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'vault', 'skills');
const PROMPTS_DIR = path.join(ROOT, 'vault', 'prompts');

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

function stripFrontmatter(content) {
  const match = content.match(FRONTMATTER_RE);
  if (!match) return content;
  return content.slice(match[0].length);
}

function extractFrontmatter(content) {
  const match = content.match(FRONTMATTER_RE);
  return match ? match[0] : '';
}

async function migrateSkills() {
  let entries;
  try {
    entries = await fs.readdir(SKILLS_DIR, { withFileTypes: true });
  } catch {
    console.log('No skills directory found, skipping.');
    return;
  }

  const dirs = entries.filter((e) => e.isDirectory());
  for (const dir of dirs) {
    const slug = dir.name;
    const skillDir = path.join(SKILLS_DIR, slug);
    const readmeSrc = path.join(skillDir, 'README.md');
    const readmeDest = path.join(SKILLS_DIR, `${slug}.md`);

    // Skip if README already moved outside
    if (await exists(readmeDest)) {
      console.log(`  skill ${slug}: ${slug}.md already exists outside, skipping`);
      continue;
    }

    try {
      const content = await fs.readFile(readmeSrc, 'utf8');
      await fs.writeFile(readmeDest, content, 'utf8');
      await fs.rm(readmeSrc);
      console.log(`  skill ${slug}: README.md → ${slug}.md`);
    } catch {
      console.log(`  skill ${slug}: no README.md inside folder, skipping`);
    }
  }
}

async function migratePrompts() {
  let entries;
  try {
    entries = await fs.readdir(PROMPTS_DIR, { withFileTypes: true });
  } catch {
    console.log('No prompts directory found, skipping.');
    return;
  }

  const dirs = entries.filter((e) => e.isDirectory());
  for (const dir of dirs) {
    const slug = dir.name;
    const promptDir = path.join(PROMPTS_DIR, slug);
    const destFile = path.join(PROMPTS_DIR, `${slug}.md`);

    // Skip if already migrated
    if (await exists(destFile)) {
      console.log(`  prompt ${slug}: ${slug}.md already exists, skipping`);
      continue;
    }

    let readmeContent = '';
    let promptContent = '';

    try {
      readmeContent = await fs.readFile(path.join(promptDir, 'README.md'), 'utf8');
    } catch {
      console.log(`  prompt ${slug}: no README.md, skipping`);
      continue;
    }

    try {
      const raw = await fs.readFile(path.join(promptDir, 'prompt.md'), 'utf8');
      // Strip any frontmatter from prompt.md (shouldn't have any, but be safe)
      promptContent = stripFrontmatter(raw).trim();
    } catch {
      // No prompt.md — use readme body as copy content
      promptContent = stripFrontmatter(readmeContent).trim();
    }

    const frontmatter = extractFrontmatter(readmeContent);
    const readmeBody = stripFrontmatter(readmeContent).trim();

    // Build combined file
    let combined = frontmatter;
    combined += '\n' + promptContent + '\n';
    if (readmeBody) {
      combined += '\n<!-- copy:end -->\n\n' + readmeBody + '\n';
    }

    await fs.writeFile(destFile, combined, 'utf8');
    await fs.rm(promptDir, { recursive: true });
    console.log(`  prompt ${slug}: merged into ${slug}.md`);
  }
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

console.log('Migrating skills...');
await migrateSkills();
console.log('Migrating prompts...');
await migratePrompts();
console.log('Done.');
