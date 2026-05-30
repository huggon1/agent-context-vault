import * as React from "react";
import {
  fetchProjects,
  registerProject,
  deleteProject as deleteProjectApi,
  renameProject as renameProjectApi,
} from "../api/client";
import type { Project } from "../lib/types";

interface ProjectsContextValue {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  register: (path: string, name?: string) => Promise<Project>;
  remove: (id: string) => Promise<void>;
  rename: (id: string, name: string) => Promise<void>;
}

const ProjectsContext = React.createContext<ProjectsContextValue | undefined>(undefined);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { projects } = await fetchProjects();
      setProjects(projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const register = React.useCallback(
    async (path: string, name?: string) => {
      const { project } = await registerProject(path, name);
      await refresh();
      return project;
    },
    [refresh],
  );

  const remove = React.useCallback(
    async (id: string) => {
      await deleteProjectApi(id);
      await refresh();
    },
    [refresh],
  );

  const rename = React.useCallback(
    async (id: string, name: string) => {
      await renameProjectApi(id, name);
      await refresh();
    },
    [refresh],
  );

  return (
    <ProjectsContext.Provider
      value={{ projects, loading, error, refresh, register, remove, rename }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const value = React.useContext(ProjectsContext);
  if (!value) throw new Error("useProjects must be used within ProjectsProvider");
  return value;
}
