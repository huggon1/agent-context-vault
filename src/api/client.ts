import type { InstallAgent, InstalledEntry, Library, Project, SkillInstall } from "../lib/types";

const BASE = "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `HTTP ${res.status}`) as Error & {
      status?: number;
      code?: string;
    };
    err.status = res.status;
    err.code = data?.error;
    throw err;
  }
  return data as T;
}

export function fetchLibrary() {
  return request<Library>("/api/library");
}

// ---- Projects ----
export function fetchProjects() {
  return request<{ projects: Project[] }>("/api/projects");
}

export function registerProject(path: string, name?: string) {
  return request<{ project: Project }>("/api/projects", {
    method: "POST",
    body: JSON.stringify({ path, name }),
  });
}

export function renameProject(id: string, name: string) {
  return request<{ project: Project }>("/api/projects", {
    method: "PUT",
    body: JSON.stringify({ id, name }),
  });
}

export function deleteProject(id: string) {
  return request<{ ok: true }>("/api/projects", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}

// ---- Installed status (per project) ----
export function fetchInstalled(projectId: string) {
  if (!projectId) return Promise.resolve({ installed: [] as InstalledEntry[] });
  return request<{ installed: InstalledEntry[] }>(
    `/api/installed?projectId=${encodeURIComponent(projectId)}`,
  );
}

export function installSkill(slug: string, projectId: string, agent: InstallAgent) {
  return request<{ ok: true }>("/api/install", {
    method: "POST",
    body: JSON.stringify({ slug, projectId, agent }),
  });
}

export function uninstallSkill(slug: string, projectId: string, agent: InstallAgent, force = false) {
  return request<{ ok: true }>("/api/uninstall", {
    method: "DELETE",
    body: JSON.stringify({ slug, projectId, agent, force }),
  });
}

// ---- Prompt asset read/write (unchanged) ----
export function fetchAssetRaw(type: "prompt", slug: string) {
  return request<{ content: string }>(`/api/asset?type=${type}&slug=${encodeURIComponent(slug)}`);
}

export function saveAsset(type: "prompt", slug: string, content: string) {
  return request<{ ok: true }>("/api/asset", {
    method: "PUT",
    body: JSON.stringify({ type, slug, content }),
  });
}

export function renameSkill(slug: string, newSlug: string) {
  return request<{ ok: true; slug: string }>("/api/skill/rename", {
    method: "POST",
    body: JSON.stringify({ slug, newSlug }),
  });
}

export function importSkill(url: string, force = false) {
  return request<{ ok: true; slug: string }>("/api/import", {
    method: "POST",
    body: JSON.stringify({ url, force }),
  });
}

export async function deleteSkill(slug: string, force = false) {
  const res = await fetch("/api/skill", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug, force }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    installs?: SkillInstall[];
  };
  return { ok: res.ok, error: data.error, installs: data.installs };
}

export function fetchSkillInstalls(slug: string) {
  return request<{ installs: SkillInstall[] }>(
    `/api/skill/installs?slug=${encodeURIComponent(slug)}`,
  );
}
