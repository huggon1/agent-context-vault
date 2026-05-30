import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let tmp;
let manifest;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'av-manifest-'));
  process.env.AGENT_VAULT_HOME = tmp;
  manifest = await import(`./manifest.mjs?${Date.now()}`); // fresh module
});

afterEach(async () => {
  delete process.env.AGENT_VAULT_HOME;
  await fs.rm(tmp, { recursive: true, force: true });
});

describe('manifest store', () => {
  it('returns null for an unknown baseline', async () => {
    expect(await manifest.getBaseline('p1', 'foo', 'claude-code')).toBe(null);
  });

  it('sets and gets a baseline', async () => {
    await manifest.setBaseline('p1', 'foo', 'claude-code', 'HASH');
    const got = await manifest.getBaseline('p1', 'foo', 'claude-code');
    expect(got.baseHash).toBe('HASH');
    expect(typeof got.installedAt).toBe('string');
  });

  it('removes a single baseline', async () => {
    await manifest.setBaseline('p1', 'foo', 'codex', 'H');
    await manifest.removeBaseline('p1', 'foo', 'codex');
    expect(await manifest.getBaseline('p1', 'foo', 'codex')).toBe(null);
  });

  it('removes all baselines for a project', async () => {
    await manifest.setBaseline('p1', 'a', 'claude-code', 'H');
    await manifest.setBaseline('p1', 'b', 'codex', 'H');
    await manifest.setBaseline('p2', 'a', 'claude-code', 'H');
    await manifest.removeProjectBaselines('p1');
    expect(await manifest.getBaseline('p1', 'a', 'claude-code')).toBe(null);
    expect(await manifest.getBaseline('p2', 'a', 'claude-code')).not.toBe(null);
  });
});
