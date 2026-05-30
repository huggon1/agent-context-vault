import { promises as fs } from 'node:fs';
import { agentVaultHome, MANIFEST_FILE } from './paths.mjs';

function keyFor(projectId, slug, agent) {
  return `${projectId}:${slug}:${agent}`;
}

async function load() {
  try {
    const raw = await fs.readFile(MANIFEST_FILE(), 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function save(obj) {
  await fs.mkdir(agentVaultHome(), { recursive: true });
  await fs.writeFile(MANIFEST_FILE(), JSON.stringify(obj, null, 2));
}

export async function getBaseline(projectId, slug, agent) {
  const m = await load();
  return m[keyFor(projectId, slug, agent)] ?? null;
}

export async function setBaseline(projectId, slug, agent, baseHash) {
  const m = await load();
  m[keyFor(projectId, slug, agent)] = { baseHash, installedAt: new Date().toISOString() };
  await save(m);
}

export async function removeBaseline(projectId, slug, agent) {
  const m = await load();
  delete m[keyFor(projectId, slug, agent)];
  await save(m);
}

export async function removeProjectBaselines(projectId) {
  const m = await load();
  const prefix = `${projectId}:`;
  for (const k of Object.keys(m)) {
    if (k.startsWith(prefix)) delete m[k];
  }
  await save(m);
}
