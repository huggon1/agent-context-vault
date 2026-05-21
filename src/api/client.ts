import type { AgentVaultConfig, InstallAgent, InstalledEntry, Library } from "../lib/types";

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

export function fetchInstalled(path: string) {
  if (!path) return Promise.resolve({ installed: [] as InstalledEntry[] });
  return request<{ installed: InstalledEntry[] }>(`/api/installed?path=${encodeURIComponent(path)}`);
}

export function installSkill(slug: string, targetPath: string, agent: InstallAgent) {
  return request<{ ok: true }>("/api/install", {
    method: "POST",
    body: JSON.stringify({ slug, targetPath, agent }),
  });
}

export function uninstallSkill(slug: string, targetPath: string, agent: InstallAgent, force = false) {
  return request<{ ok: true }>("/api/uninstall", {
    method: "DELETE",
    body: JSON.stringify({ slug, targetPath, agent, force }),
  });
}

export function fetchConfig() {
  return request<AgentVaultConfig>("/api/config");
}

export function saveConfig(currentPath: string) {
  return request<AgentVaultConfig>("/api/config", {
    method: "POST",
    body: JSON.stringify({ currentPath }),
  });
}
