export type AgentTag = "claude-code" | "codex" | "all" | string;

export interface Skill {
  slug: string;
  name: string;
  description: string;
  updatedAt: string;
  readmeBody: string;
}

export interface Prompt {
  slug: string;
  title: string;
  description: string;
  updatedAt: string;
  promptContent: string;
}

export interface Library {
  skills: Skill[];
  prompts: Prompt[];
}

export type InstallAgent = "claude-code" | "codex";

export type InstallStatus =
  | "synced"
  | "source-updated"
  | "drift"
  | "conflict"
  | "unknown";

export interface InstalledEntry {
  slug: string;
  agent: InstallAgent;
  status: InstallStatus;
}

export interface SkillInstall {
  projectId: string;
  agent: InstallAgent;
  status: InstallStatus;
}

export interface Project {
  id: string;
  path: string;
  name: string;
  createdAt: string;
}
