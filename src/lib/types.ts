export type AgentTag = "claude-code" | "codex" | "all" | string;

export interface AssetBase {
  slug: string;
  title: string;
  description: string;
  agents: AgentTag[];
  updatedAt: string;
  readmeBody: string;
}

export type Skill = AssetBase;

export interface Prompt extends AssetBase {
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
