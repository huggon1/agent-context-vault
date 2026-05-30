import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let tmp;
let projectDir;
let skills;
let projects;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'av-skills-'));
  process.env.AGENT_VAULT_HOME = path.join(tmp, 'home');
  process.env.AGENT_VAULT_SKILLS_DIR = path.join(tmp, 'vault', 'skills');
  projectDir = path.join(tmp, 'proj');
  await fs.mkdir(path.join(projectDir, '.claude', 'skills'), { recursive: true });
  await fs.mkdir(process.env.AGENT_VAULT_SKILLS_DIR, { recursive: true });
  projects = await import(`./projects.mjs?${Date.now()}`);
  skills = await import(`./skills.mjs?${Date.now()}`);
});

afterEach(async () => {
  delete process.env.AGENT_VAULT_HOME;
  delete process.env.AGENT_VAULT_SKILLS_DIR;
  await fs.rm(tmp, { recursive: true, force: true });
});

async function makeSourceSkill(slug) {
  const dir = path.join(process.env.AGENT_VAULT_SKILLS_DIR, slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'SKILL.md'), `---\nname: ${slug}\n---\nbody`);
}

async function installCopy(slug) {
  const dir = path.join(projectDir, '.claude', 'skills', slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'SKILL.md'), `---\nname: ${slug}\n---\nbody`);
}

describe('skills operations', () => {
  it('deletes a source skill not installed anywhere', async () => {
    await makeSourceSkill('foo');
    const res = await skills.deleteSkill('foo', { force: false });
    expect(res.ok).toBe(true);
    expect(
      await fs.access(path.join(process.env.AGENT_VAULT_SKILLS_DIR, 'foo')).then(() => true).catch(() => false),
    ).toBe(false);
  });

  it('refuses to delete an installed skill without force', async () => {
    await makeSourceSkill('bar');
    await installCopy('bar');
    await projects.addProject({ path: projectDir });
    const res = await skills.deleteSkill('bar', { force: false });
    expect(res.ok).toBe(false);
    expect(res.installs.length).toBeGreaterThan(0);
    expect(
      await fs.access(path.join(process.env.AGENT_VAULT_SKILLS_DIR, 'bar')).then(() => true).catch(() => false),
    ).toBe(true);
  });

  it('force-deletes an installed skill (source only; copies untouched)', async () => {
    await makeSourceSkill('baz');
    await installCopy('baz');
    await projects.addProject({ path: projectDir });
    const res = await skills.deleteSkill('baz', { force: true });
    expect(res.ok).toBe(true);
  });

  it('force-delete clears the skill\'s baselines', async () => {
    await makeSourceSkill('zap');
    await installCopy('zap');
    const p = await projects.addProject({ path: projectDir });
    const manifest = await import(`./manifest.mjs?${Date.now()}`);
    await manifest.setBaseline(p.id, 'zap', 'claude-code', 'H');
    await skills.deleteSkill('zap', { force: true });
    expect(await manifest.getBaseline(p.id, 'zap', 'claude-code')).toBe(null);
  });

  it('reverse map finds installs across projects', async () => {
    await makeSourceSkill('qux');
    await installCopy('qux');
    const p = await projects.addProject({ path: projectDir });
    const installs = await skills.findInstallsOfSkill('qux');
    expect(installs).toEqual([
      expect.objectContaining({ projectId: p.id, agent: 'claude-code' }),
    ]);
  });
});
