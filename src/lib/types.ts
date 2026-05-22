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

export interface InstalledEntry {
  slug: string;
  agent: InstallAgent;
  modified: boolean;
}

export interface AgentVaultConfig {
  currentPath: string;
  recentPaths: string[];
}
