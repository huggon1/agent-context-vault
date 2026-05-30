import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let tmp;
let projectDir;
let projects;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'av-projects-'));
  process.env.AGENT_VAULT_HOME = path.join(tmp, 'home');
  projectDir = path.join(tmp, 'my-app');
  await fs.mkdir(projectDir, { recursive: true });
  projects = await import(`./projects.mjs?${Date.now()}`);
});

afterEach(async () => {
  delete process.env.AGENT_VAULT_HOME;
  await fs.rm(tmp, { recursive: true, force: true });
});

describe('projects store', () => {
  it('starts empty', async () => {
    expect(await projects.listProjects()).toEqual([]);
  });

  it('ignores legacy currentPath/recentPaths config', async () => {
    await fs.mkdir(process.env.AGENT_VAULT_HOME, { recursive: true });
    await fs.writeFile(
      path.join(process.env.AGENT_VAULT_HOME, 'config.json'),
      JSON.stringify({ currentPath: '/old', recentPaths: ['/old'] }),
    );
    expect(await projects.listProjects()).toEqual([]);
  });

  it('registers a project and defaults name to folder name', async () => {
    const p = await projects.addProject({ path: projectDir });
    expect(p.path).toBe(projectDir);
    expect(p.name).toBe('my-app');
    expect(typeof p.id).toBe('string');
    expect(typeof p.createdAt).toBe('string');
    expect(await projects.listProjects()).toHaveLength(1);
  });

  it('rejects a relative path', async () => {
    await expect(projects.addProject({ path: 'relative/dir' })).rejects.toThrow(/absolute/);
  });

  it('rejects a path that is not a directory', async () => {
    await expect(projects.addProject({ path: path.join(tmp, 'nope') })).rejects.toThrow(/directory/);
  });

  it('removes a project by id', async () => {
    const p = await projects.addProject({ path: projectDir });
    await projects.removeProject(p.id);
    expect(await projects.listProjects()).toEqual([]);
  });

  it('renames a project', async () => {
    const p = await projects.addProject({ path: projectDir });
    await projects.renameProject(p.id, 'Renamed');
    const [got] = await projects.listProjects();
    expect(got.name).toBe('Renamed');
  });
});
