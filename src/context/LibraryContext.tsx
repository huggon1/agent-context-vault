import * as React from "react";
import { ToastProvider } from "../components/ui/toast";
import { fetchLibrary } from "../api/client";
import type { Library } from "../lib/types";

interface LibraryContextValue {
  library: Library | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const LibraryContext = React.createContext<LibraryContextValue | undefined>(undefined);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [library, setLibrary] = React.useState<Library | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLibrary();
      setLibrary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
    function onFocus() {
      void refresh();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return (
    <ToastProvider>
      <LibraryContext.Provider value={{ library, loading, error, refresh }}>
        {children}
      </LibraryContext.Provider>
    </ToastProvider>
  );
}

export function useLibrary() {
  const value = React.useContext(LibraryContext);
  if (!value) throw new Error("useLibrary must be used within LibraryProvider");
  return value;
}
