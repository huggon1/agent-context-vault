import { createServer } from 'node:http';
import https from 'node:https';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, parsePromptBody } from './parser.mjs';

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

async function readDirSafe(dir, { type = 'dir' } = {}) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    if (type === 'dir') return entries.filter((e) => e.isDirectory()).map((e) => e.name);
    if (type === 'md') return entries.filter((e) => e.isFile() && e.name.endsWith('.md')).map((e) => e.name.slice(0, -3));
    return entries.map((e) => e.name);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function readSkill(slug) {
  const absDir = path.join(SKILLS_DIR, slug);
  const skillFile = path.join(absDir, 'SKILL.md');
  const updatedAt = await getUpdatedAt(absDir);
  try {
    const raw = await fs.readFile(skillFile, 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const name = typeof data.name === 'string' && data.name ? data.name : slug;
    const description = typeof data.description === 'string' ? data.description : '';
    return { slug, name, description, updatedAt, readmeBody: body };
  } catch {
    return { slug, name: slug, description: '', updatedAt, readmeBody: '' };
  }
}

async function readPrompt(slug) {
  const promptFile = path.join(PROMPTS_DIR, `${slug}.md`);
  let raw;
  try {
    raw = await fs.readFile(promptFile, 'utf8');
  } catch {
    return null;
  }
  const { data, body } = parseFrontmatter(raw);
  const { copyContent } = parsePromptBody(body);
  const updatedAt = await getUpdatedAt(promptFile);
  const title = typeof data.title === 'string' && data.title ? data.title : slug;
  const description = typeof data.description === 'string' ? data.description : '';
  return {
    slug,
    title,
    description,
    updatedAt,
    promptContent: copyContent.trim(),
  };
}

async function listLibrary() {
  const [skillSlugs, promptSlugs] = await Promise.all([
    readDirSafe(SKILLS_DIR),
    readDirSafe(PROMPTS_DIR, { type: 'md' }),
  ]);
  const skills = (await Promise.all(skillSlugs.map((s) => readSkill(s)))).filter(Boolean);
  const prompts = (await Promise.all(promptSlugs.map((s) => readPrompt(s)))).filter(Boolean);
  skills.sort((a, b) => a.name.localeCompare(b.name));
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
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  res.end(payload);
}

async function handleGetAsset(_req, res, url) {
  const type = url.searchParams.get('type');
  const slug = url.searchParams.get('slug');
  if (type !== 'prompt') return sendJson(res, 400, { error: 'invalid_type' });
  if (!validateSlug(slug)) return sendJson(res, 400, { error: 'invalid_slug' });
  const filePath = path.join(PROMPTS_DIR, `${slug}.md`);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    sendJson(res, 200, { content });
  } catch {
    sendJson(res, 404, { error: 'not_found' });
  }
}

async function handleSaveAsset(req, res) {
  const body = await readJsonBody(req);
  const { type, slug, content } = body;
  if (type !== 'prompt') return sendJson(res, 400, { error: 'invalid_type' });
  if (!validateSlug(slug)) return sendJson(res, 400, { error: 'invalid_slug' });
  if (typeof content !== 'string') return sendJson(res, 400, { error: 'invalid_content' });
  const filePath = path.join(PROMPTS_DIR, `${slug}.md`);
  await fs.writeFile(filePath, content, 'utf8');
  mtimeCache.delete(filePath);
  sendJson(res, 200, { ok: true });
}

async function findInstalledAgents(slug, targetPath) {
  if (!validateAbsolutePath(targetPath)) return [];
  const found = [];
  for (const agent of Object.keys(AGENT_DIRS)) {
    const dir = skillTargetDir(targetPath, slug, agent);
    if (await pathExists(dir)) found.push(agent);
  }
  return found;
}

async function handleSkillRename(req, res) {
  const body = await readJsonBody(req);
  const { slug, newSlug, targetPath } = body;
  if (!validateSlug(slug)) return sendJson(res, 400, { error: 'invalid_slug' });
  if (!validateSlug(newSlug)) return sendJson(res, 400, { error: 'invalid_new_slug' });
  if (slug === newSlug) return sendJson(res, 400, { error: 'same_slug' });

  const oldDir = path.join(SKILLS_DIR, slug);
  const newDir = path.join(SKILLS_DIR, newSlug);
  if (!(await pathExists(oldDir))) return sendJson(res, 404, { error: 'skill_not_found' });
  if (await pathExists(newDir)) return sendJson(res, 409, { error: 'slug_exists' });

  if (typeof targetPath === 'string' && targetPath) {
    const installed = await findInstalledAgents(slug, targetPath);
    if (installed.length > 0) {
      return sendJson(res, 409, { error: 'installed', agents: installed });
    }
  }

  await fs.rename(oldDir, newDir);
  mtimeCache.delete(oldDir);
  mtimeCache.delete(newDir);

  const skillFile = path.join(newDir, 'SKILL.md');
  try {
    const raw = await fs.readFile(skillFile, 'utf8');
    const updated = raw.replace(/^name:\s*.*$/m, `name: ${newSlug}`);
    if (updated === raw) {
      // No name field present — insert one after the opening ---
      const inserted = raw.replace(/^---\r?\n/, (m) => `${m}name: ${newSlug}\n`);
      await fs.writeFile(skillFile, inserted, 'utf8');
    } else {
      await fs.writeFile(skillFile, updated, 'utf8');
    }
    mtimeCache.delete(skillFile);
  } catch {
    // SKILL.md may not exist; ignore
  }

  sendJson(res, 200, { ok: true, slug: newSlug });
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

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}

const GH_HEADERS = { 'User-Agent': 'agent-vault/1.0', 'Accept': 'application/vnd.github+json' };

async function githubGet(apiUrl) {
  const { status, body } = await httpsGet(apiUrl, GH_HEADERS);
  if (status !== 200) {
    const err = new Error(`GitHub API ${status}`);
    err.ghStatus = status;
    throw err;
  }
  return JSON.parse(body.toString('utf8'));
}

async function githubGetRaw(downloadUrl) {
  const { status, body } = await httpsGet(downloadUrl, { 'User-Agent': 'agent-vault/1.0' });
  if (status !== 200) throw new Error(`Raw download ${status}: ${downloadUrl}`);
  return body;
}

const GH_TREE_RE = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)$/;

function parseGitHubTreeUrl(rawUrl) {
  const m = GH_TREE_RE.exec(rawUrl.trim());
  if (!m) return null;
  const [, owner, repo, branch, remotePath] = m;
  return { owner, repo, branch, remotePath };
}

async function downloadGitHubDir(owner, repo, branch, remotePath, localDir) {
  const encodedPath = remotePath.split('/').map(encodeURIComponent).join('/');
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;
  const entries = await githubGet(apiUrl);
  if (!Array.isArray(entries)) throw new Error('Expected directory listing from GitHub API');
  await fs.mkdir(localDir, { recursive: true });
  for (const entry of entries) {
    if (entry.type === 'file') {
      const data = await githubGetRaw(entry.download_url);
      await fs.writeFile(path.join(localDir, entry.name), data);
    } else if (entry.type === 'dir') {
      await downloadGitHubDir(owner, repo, branch, entry.path, path.join(localDir, entry.name));
    }
  }
}

async function handleImport(req, res) {
  const body = await readJsonBody(req);
  const { url, force = false } = body;
  if (typeof url !== 'string' || !url.trim())
    return sendJson(res, 400, { error: 'missing_url', message: 'url is required.' });

  const parsed = parseGitHubTreeUrl(url);
  if (!parsed)
    return sendJson(res, 400, {
      error: 'invalid_url',
      message: 'Must be a GitHub tree URL: https://github.com/{owner}/{repo}/tree/{branch}/{path}',
    });

  const { owner, repo, branch, remotePath } = parsed;
  const slug = remotePath.split('/').filter(Boolean).at(-1) ?? '';
  if (!validateSlug(slug))
    return sendJson(res, 400, { error: 'invalid_slug', message: `Derived slug "${slug}" is not valid.` });

  const destDir = path.join(SKILLS_DIR, slug);
  if (!force && (await pathExists(destDir)))
    return sendJson(res, 409, { error: 'skill_exists', slug, message: `Skill "${slug}" already exists.` });

  try {
    if (await pathExists(destDir)) {
      await fs.rm(destDir, { recursive: true, force: true });
      mtimeCache.delete(destDir);
    }
    await downloadGitHubDir(owner, repo, branch, remotePath, destDir);
    mtimeCache.delete(destDir);
    sendJson(res, 200, { ok: true, slug });
  } catch (err) {
    await fs.rm(destDir, { recursive: true, force: true }).catch(() => {});
    if (err.ghStatus === 404)
      return sendJson(res, 502, { error: 'github_not_found', message: 'GitHub returned 404 — check the URL.' });
    if (err.ghStatus === 403 || err.ghStatus === 429)
      return sendJson(res, 502, { error: 'github_rate_limit', message: 'GitHub API rate limit. Try again later.' });
    sendJson(res, 502, { error: 'github_error', message: String(err.message) });
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'access-control-allow-origin': ALLOWED_ORIGIN,
        'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'access-control-allow-headers': 'content-type',
        'access-control-max-age': '86400',
      });
      return res.end();
    }
    const url = new URL(req.url, `http://${req.headers.host}`);
    const { pathname } = url;
    if (pathname === '/api/library' && req.method === 'GET') return handleLibrary(req, res);
    if (pathname === '/api/installed' && req.method === 'GET') return handleInstalled(req, res, url);
    if (pathname === '/api/install' && req.method === 'POST') return handleInstall(req, res);
    if (pathname === '/api/uninstall' && req.method === 'DELETE') return handleUninstall(req, res);
    if (pathname === '/api/asset' && req.method === 'GET') return handleGetAsset(req, res, url);
    if (pathname === '/api/asset' && req.method === 'PUT') return handleSaveAsset(req, res);
    if (pathname === '/api/skill/rename' && req.method === 'POST') return handleSkillRename(req, res);
    if (pathname === '/api/import' && req.method === 'POST') return handleImport(req, res);
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
