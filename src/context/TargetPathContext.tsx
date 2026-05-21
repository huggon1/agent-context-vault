import * as React from "react";
import { fetchConfig, fetchInstalled, saveConfig as saveConfigApi } from "../api/client";
import type { AgentVaultConfig, InstalledEntry } from "../lib/types";

interface TargetPathContextValue {
  currentPath: string;
  recentPaths: string[];
  installed: InstalledEntry[];
  loading: boolean;
  setCurrentPath: (path: string) => Promise<void>;
  refreshInstalled: () => Promise<void>;
}

const TargetPathContext = React.createContext<TargetPathContextValue | undefined>(undefined);

export function TargetPathProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<AgentVaultConfig>({ currentPath: "", recentPaths: [] });
  const [installed, setInstalled] = React.useState<InstalledEntry[]>([]);
  const [loading, setLoading] = React.useState(false);

  const refreshInstalled = React.useCallback(async () => {
    if (!config.currentPath) {
      setInstalled([]);
      return;
    }
    setLoading(true);
    try {
      const { installed: list } = await fetchInstalled(config.currentPath);
      setInstalled(list);
    } catch {
      setInstalled([]);
    } finally {
      setLoading(false);
    }
  }, [config.currentPath]);

  React.useEffect(() => {
    fetchConfig().then(setConfig).catch(() => undefined);
  }, []);

  React.useEffect(() => {
    void refreshInstalled();
  }, [refreshInstalled]);

  const setCurrentPath = React.useCallback(async (path: string) => {
    const next = await saveConfigApi(path);
    setConfig(next);
  }, []);

  return (
    <TargetPathContext.Provider
      value={{
        currentPath: config.currentPath,
        recentPaths: config.recentPaths,
        installed,
        loading,
        setCurrentPath,
        refreshInstalled,
      }}
    >
      {children}
    </TargetPathContext.Provider>
  );
}

export function useTargetPath() {
  const value = React.useContext(TargetPathContext);
  if (!value) throw new Error("useTargetPath must be used within TargetPathProvider");
  return value;
}
