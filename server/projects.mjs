import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { agentVaultHome, CONFIG_FILE, validateAbsolutePath } from './paths.mjs';
import { removeProjectBaselines } from './manifest.mjs';

async function load() {
  try {
    const raw = await fs.readFile(CONFIG_FILE(), 'utf8');
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed.projects) ? parsed.projects : [];
    return list.filter(
      (p) => p && typeof p.id === 'string' && typeof p.path === 'string',
    );
  } catch {
    return [];
  }
}

async function save(list) {
  await fs.mkdir(agentVaultHome(), { recursive: true });
  await fs.writeFile(CONFIG_FILE(), JSON.stringify({ projects: list }, null, 2));
}

export async function listProjects() {
  return load();
}

export async function getProject(id) {
  const list = await load();
  return list.find((p) => p.id === id) ?? null;
}

export async function addProject({ path: targetPath, name }) {
  if (!validateAbsolutePath(targetPath)) {
    throw new Error('path must be absolute');
  }
  let stat;
  try {
    stat = await fs.stat(targetPath);
  } catch {
    throw new Error('path must be a directory');
  }
  if (!stat.isDirectory()) {
    throw new Error('path must be a directory');
  }
  const list = await load();
  const project = {
    id: crypto.randomUUID(),
    path: targetPath,
    name: (typeof name === 'string' && name.trim()) || path.basename(targetPath),
    createdAt: new Date().toISOString(),
  };
  list.push(project);
  await save(list);
  return project;
}

export async function removeProject(id) {
  const list = await load();
  const next = list.filter((p) => p.id !== id);
  await save(next);
  await removeProjectBaselines(id);
}

export async function renameProject(id, name) {
  const list = await load();
  const project = list.find((p) => p.id === id);
  if (!project) throw new Error('project not found');
  project.name = String(name).trim() || project.name;
  await save(list);
  return project;
}
