import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './parser.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT, 'assets');
const SKILLS_DIR = path.join(ASSETS_DIR, 'skills');
const PROMPTS_DIR = path.join(ASSETS_DIR, 'prompts');
const CONFIG_DIR = path.join(os.homedir(), '.agent-vault');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const PORT = Number(process.env.AGENT_VAULT_PORT || 5179);
const ALLOWED_ORIGIN = process.env.AGENT_VAULT_ORIGIN || 'http://localhost:5173';

function execFileP(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, opts, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve({ stdout, stderr });
    });
  });
}

const mtimeCache = new Map();
async function getUpdatedAt(absPath) {
  if (mtimeCache.has(absPath)) return mtimeCache.get(absPath);
  let result;
  try {
    const { stdout } = await execFileP(
      'git',
      ['log', '-1', '--format=%cI', '--', absPath],
      { cwd: ROOT },
    );
    const trimmed = stdout.trim();
    if (trimmed) result = trimmed;
  } catch {
    // fall through to fs.stat
  }
  if (!result) {
    try {
      const stat = await fs.stat(absPath);
      result = stat.mtime.toISOString();
    } catch {
      result = new Date(0).toISOString();
    }
  }
  mtimeCache.set(absPath, result);
  return result;
}

async function readDirSafe(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function readAssetMeta(absDir, slug) {
  let raw;
  try {
    raw = await fs.readFile(path.join(absDir, 'README.md'), 'utf8');
  } catch {
    return null;
  }
  const { data, body } = parseFrontmatter(raw);
  const title = typeof data.title === 'string' && data.title ? data.title : slug;
  const description = typeof data.description === 'string' ? data.description : '';
  let agents;
  if (Array.isArray(data.agents)) agents = data.agents;
  else if (typeof data.agents === 'string' && data.agents.trim()) agents = [data.agents.trim()];
  else agents = ['all'];
  const updatedAt = await getUpdatedAt(absDir);
  return { slug, title, description, agents, updatedAt, readmeBody: body };
}

async function readSkill(slug) {
  const absDir = path.join(SKILLS_DIR, slug);
  return readAssetMeta(absDir, slug);
}

async function readPrompt(slug) {
  const absDir = path.join(PROMPTS_DIR, slug);
  const meta = await readAssetMeta(absDir, slug);
  if (!meta) return null;
  let promptContent = '';
  try {
    const raw = await fs.readFile(path.join(absDir, 'prompt.md'), 'utf8');
    const { body } = parseFrontmatter(raw);
    promptContent = body.trimEnd() + '\n';
  } catch {
    promptContent = meta.readmeBody.trimEnd() + '\n';
  }
  return { ...meta, promptContent };
}

async function listLibrary() {
  const [skillSlugs, promptSlugs] = await Promise.all([
    readDirSafe(SKILLS_DIR),
    readDirSafe(PROMPTS_DIR),
  ]);
  const skills = (await Promise.all(skillSlugs.map((s) => readSkill(s)))).filter(Boolean);
  const prompts = (await Promise.all(promptSlugs.map((s) => readPrompt(s)))).filter(Boolean);
  skills.sort((a, b) => a.title.localeCompare(b.title));
  prompts.sort((a, b) => a.title.localeCompare(b.title));
  return { skills, prompts };
}

async function hashDir(dir) {
  const hash = crypto.createHash('sha256');
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        hash.update('D:' + path.relative(dir, full) + '\n');
        await walk(full);
      } else if (entry.isFile()) {
        const content = await fs.readFile(full);
        hash.update('F:' + path.relative(dir, full) + ':' + content.length + '\n');
        hash.update(content);
      }
    }
  }
  await walk(dir);
  return hash.digest('hex');
}

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(src, dest) {
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

function validateSlug(slug) {
  return typeof slug === 'string' && SLUG_RE.test(slug);
}

function validateAbsolutePath(p) {
  return typeof p === 'string' && path.isAbsolute(p);
}

const AGENT_DIRS = {
  'claude-code': '.claude',
  codex: '.codex',
};

function isValidAgent(agent) {
  return typeof agent === 'string' && Object.prototype.hasOwnProperty.call(AGENT_DIRS, agent);
}

function skillTargetDir(targetPath, slug, agent) {
  const agentDir = AGENT_DIRS[agent];
  return path.join(targetPath, agentDir, 'skills', slug);
}

async function loadConfig() {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      currentPath: typeof parsed.currentPath === 'string' ? parsed.currentPath : '',
      recentPaths: Array.isArray(parsed.recentPaths) ? parsed.recentPaths.filter((s) => typeof s === 'string') : [],
    };
  } catch {
    return { currentPath: '', recentPaths: [] };
  }
}

async function saveConfig(cfg) {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if (!text.trim()) return resolve({});
      try {
        resolve(JSON.parse(text));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'access-control-allow-origin': ALLOWED_ORIGIN,
    'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  res.end(payload);
}

async function handleLibrary(_req, res) {
  mtimeCache.clear();
  const lib = await listLibrary();
  sendJson(res, 200, lib);
}

async function handleInstalled(req, res, url) {
  const target = url.searchParams.get('path') || '';
  if (!validateAbsolutePath(target)) {
    return sendJson(res, 200, { installed: [] });
  }
  const sourceSlugs = await readDirSafe(SKILLS_DIR);
  const installed = [];
  for (const agent of Object.keys(AGENT_DIRS)) {
    const skillsRoot = path.join(target, AGENT_DIRS[agent], 'skills');
    const slugs = await readDirSafe(skillsRoot);
    for (const slug of slugs) {
      if (!sourceSlugs.includes(slug)) continue;
      const localDir = path.join(skillsRoot, slug);
      const srcDir = path.join(SKILLS_DIR, slug);
      let modified = false;
      try {
        const [a, b] = await Promise.all([hashDir(localDir), hashDir(srcDir)]);
        modified = a !== b;
      } catch {
        modified = true;
      }
      installed.push({ slug, agent, modified });
    }
  }
  sendJson(res, 200, { installed });
}

async function handleInstall(req, res) {
  const body = await readJsonBody(req);
  const { slug, targetPath, agent = 'claude-code' } = body;
  if (!validateSlug(slug)) return sendJson(res, 400, { error: 'invalid_slug' });
  if (!validateAbsolutePath(targetPath)) return sendJson(res, 400, { error: 'invalid_target_path' });
  if (!isValidAgent(agent)) return sendJson(res, 400, { error: 'invalid_agent' });
  const src = path.join(SKILLS_DIR, slug);
  if (!(await pathExists(src))) return sendJson(res, 404, { error: 'skill_not_found' });
  const dest = skillTargetDir(targetPath, slug, agent);
  if (await pathExists(dest)) {
    await fs.rm(dest, { recursive: true, force: true });
  }
  await copyDir(src, dest);
  sendJson(res, 200, { ok: true });
}

async function handleUninstall(req, res) {
  const body = await readJsonBody(req);
  const { slug, targetPath, agent = 'claude-code', force } = body;
  if (!validateSlug(slug)) return sendJson(res, 400, { error: 'invalid_slug' });
  if (!validateAbsolutePath(targetPath)) return sendJson(res, 400, { error: 'invalid_target_path' });
  if (!isValidAgent(agent)) return sendJson(res, 400, { error: 'invalid_agent' });
  const dest = skillTargetDir(targetPath, slug, agent);
  if (!(await pathExists(dest))) return sendJson(res, 404, { error: 'not_installed' });
  if (!force) {
    const srcPath = path.join(SKILLS_DIR, slug);
    try {
      const [a, b] = await Promise.all([hashDir(dest), hashDir(srcPath)]);
      if (a !== b) {
        return sendJson(res, 409, { error: 'modified', message: 'Local copy differs from source. Pass force:true to override.' });
      }
    } catch {
      return sendJson(res, 409, { error: 'modified' });
    }
  }
  await fs.rm(dest, { recursive: true, force: true });
  sendJson(res, 200, { ok: true });
}

async function handleConfigGet(_req, res) {
  const cfg = await loadConfig();
  sendJson(res, 200, cfg);
}

async function handleConfigPost(req, res) {
  const body = await readJsonBody(req);
  const cur = await loadConfig();

  if (typeof body.removePath === 'string' && body.removePath) {
    const target = body.removePath;
    cur.recentPaths = cur.recentPaths.filter((x) => x !== target);
    if (cur.currentPath === target) cur.currentPath = '';
    await saveConfig(cur);
    return sendJson(res, 200, cur);
  }

  if (typeof body.currentPath !== 'string') return sendJson(res, 400, { error: 'invalid_path' });
  const p = body.currentPath;
  cur.currentPath = p;
  if (p) {
    cur.recentPaths = [p, ...cur.recentPaths.filter((x) => x !== p)].slice(0, 5);
  }
  await saveConfig(cur);
  sendJson(res, 200, cur);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'access-control-allow-origin': ALLOWED_ORIGIN,
        'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
        'access-control-allow-headers': 'content-type',
      });
      return res.end();
    }
    const url = new URL(req.url, `http://${req.headers.host}`);
    const { pathname } = url;
    if (pathname === '/api/library' && req.method === 'GET') return handleLibrary(req, res);
    if (pathname === '/api/installed' && req.method === 'GET') return handleInstalled(req, res, url);
    if (pathname === '/api/install' && req.method === 'POST') return handleInstall(req, res);
    if (pathname === '/api/uninstall' && req.method === 'DELETE') return handleUninstall(req, res);
    if (pathname === '/api/config' && req.method === 'GET') return handleConfigGet(req, res);
    if (pathname === '/api/config' && req.method === 'POST') return handleConfigPost(req, res);
    sendJson(res, 404, { error: 'not_found' });
  } catch (err) {
    console.error('[server] error', err);
    sendJson(res, 500, { error: 'internal_error', message: String(err?.message || err) });
  }
});

server.listen(PORT, () => {
  console.log(`[agent-vault] listening on http://localhost:${PORT}`);
});
