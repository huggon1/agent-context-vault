import path from 'node:path';
import { hashDir } from './hash.mjs';
import { pathExists } from './fsutil.mjs';
import { skillsDir, skillTargetDir } from './paths.mjs';
import { getBaseline } from './manifest.mjs';

/**
 * Classify an installed skill copy. Pure function over three hashes.
 * @returns {'synced'|'source-updated'|'drift'|'conflict'|'unknown'}
 */
export function computeStatus({ hInst, hSrc, hBase }) {
  if (hInst === hSrc) return 'synced';
  if (hBase == null) return 'unknown';
  const instChanged = hInst !== hBase;
  const srcChanged = hSrc !== hBase;
  if (srcChanged && !instChanged) return 'source-updated';
  if (instChanged && !srcChanged) return 'drift';
  return 'conflict';
}

/**
 * Status of one installed skill copy for a project.
 * Returns null if the skill is not installed for that agent.
 */
export async function skillStatus(projectId, projectPath, slug, agent) {
  const dest = skillTargetDir(projectPath, slug, agent);
  if (!(await pathExists(dest))) return null;
  const src = path.join(skillsDir(), slug);
  let hInst;
  let hSrc;
  try {
    [hInst, hSrc] = await Promise.all([hashDir(dest), hashDir(src)]);
  } catch {
    return 'unknown';
  }
  const base = await getBaseline(projectId, slug, agent);
  return computeStatus({ hInst, hSrc, hBase: base ? base.baseHash : null });
}
