import { promises as fs } from 'node:fs';
import path from 'node:path';
import { skillsDir, AGENT_DIRS, skillTargetDir } from './paths.mjs';
import { pathExists } from './fsutil.mjs';
import { listProjects } from './projects.mjs';
import { skillStatus } from './status.mjs';
import { removeSlugBaselines } from './manifest.mjs';

/** Find every registered project + agent where `slug` is installed. */
export async function findInstallsOfSkill(slug) {
  const projects = await listProjects();
  const installs = [];
  for (const project of projects) {
    for (const agent of Object.keys(AGENT_DIRS)) {
      const dir = skillTargetDir(project.path, slug, agent);
      if (await pathExists(dir)) {
        const status = await skillStatus(project.id, project.path, slug, agent);
        installs.push({ projectId: project.id, agent, status });
      }
    }
  }
  return installs;
}

/**
 * Delete a source skill. If installed anywhere and not forced, refuse and
 * report the installs. Never touches installed copies.
 */
export async function deleteSkill(slug, { force = false } = {}) {
  const src = path.join(skillsDir(), slug);
  if (!(await pathExists(src))) {
    return { ok: false, error: 'skill_not_found' };
  }
  const installs = await findInstallsOfSkill(slug);
  if (installs.length > 0 && !force) {
    return { ok: false, error: 'installed', installs };
  }
  await fs.rm(src, { recursive: true, force: true });
  await removeSlugBaselines(slug);
  return { ok: true };
}

/** Status of every installed skill in one project. */
export async function listInstalled(projectId, projectPath) {
  const installed = [];
  for (const agent of Object.keys(AGENT_DIRS)) {
    const skillsRoot = path.join(projectPath, AGENT_DIRS[agent], 'skills');
    let slugs = [];
    try {
      const entries = await fs.readdir(skillsRoot, { withFileTypes: true });
      slugs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
      slugs = [];
    }
    const sources = new Set(
      await fs.readdir(skillsDir(), { withFileTypes: true }).then(
        (entries) => entries.filter((e) => e.isDirectory()).map((e) => e.name),
        () => [],
      ),
    );
    for (const slug of slugs) {
      if (!sources.has(slug)) continue;
      const status = await skillStatus(projectId, projectPath, slug, agent);
      installed.push({ slug, agent, status });
    }
  }
  return installed;
}
