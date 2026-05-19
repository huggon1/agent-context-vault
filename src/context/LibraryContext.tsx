import * as React from "react";
import { ToastProvider } from "../components/ui/toast";
import { internalLibraryName, loadInternalLibrary } from "../data/internalLibrary";
import { Asset, ScanError } from "../lib/types";

type LibraryStatus = "idle" | "loading" | "ready" | "error";

type LibraryContextValue = {
  assets: Asset[];
  errors: ScanError[];
  status: LibraryStatus;
  rootName?: string;
  rootPathLabel?: string;
  message?: string;
};

const LibraryContext = React.createContext<LibraryContextValue | undefined>(undefined);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [errors, setErrors] = React.useState<ScanError[]>([]);
  const [status, setStatus] = React.useState<LibraryStatus>("loading");
  const [rootName] = React.useState<string>(internalLibraryName);
  const [message, setMessage] = React.useState<string>();

  React.useEffect(() => {
    try {
      const nextAssets = loadInternalLibrary();
      setAssets(nextAssets);
      setErrors([]);
      setStatus("ready");
      setMessage(undefined);
    } catch (error) {
      setAssets([]);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to load the internal library.");
    }
  }, []);

  return (
    <ToastProvider>
      <LibraryContext.Provider
        value={{
          assets,
          errors,
          status,
          rootName,
          rootPathLabel: rootName,
          message,
        }}
      >
        {children}
      </LibraryContext.Provider>
    </ToastProvider>
  );
}

export function useLibrary() {
  const value = React.useContext(LibraryContext);
  if (!value) {
    throw new Error("useLibrary must be used within LibraryProvider");
  }

  return value;
}
