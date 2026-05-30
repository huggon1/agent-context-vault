import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(__dirname, '..');
export const VAULT_DIR = path.join(ROOT, 'vault');
export function skillsDir() {
  return process.env.AGENT_VAULT_SKILLS_DIR || path.join(VAULT_DIR, 'skills');
}
export const PROMPTS_DIR = path.join(VAULT_DIR, 'prompts');

export function agentVaultHome() {
  return process.env.AGENT_VAULT_HOME || path.join(os.homedir(), '.agent-vault');
}

export const CONFIG_FILE = () => path.join(agentVaultHome(), 'config.json');
export const MANIFEST_FILE = () => path.join(agentVaultHome(), 'manifest.json');

export const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

export const AGENT_DIRS = {
  'claude-code': '.claude',
  codex: '.codex',
};

export function isValidAgent(agent) {
  return typeof agent === 'string' && Object.prototype.hasOwnProperty.call(AGENT_DIRS, agent);
}

export function validateSlug(slug) {
  return typeof slug === 'string' && SLUG_RE.test(slug);
}

export function validateAbsolutePath(p) {
  return typeof p === 'string' && path.isAbsolute(p);
}

export function skillTargetDir(targetPath, slug, agent) {
  return path.join(targetPath, AGENT_DIRS[agent], 'skills', slug);
}
