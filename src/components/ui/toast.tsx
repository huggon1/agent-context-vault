import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

type Toast = {
  id: number;
  title: string;
  description?: string;
};

type ToastContextValue = {
  toast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((nextToast: Omit<Toast, "id">) => {
    const id = Date.now();
    setToasts((current) => [...current, { ...nextToast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastViewport toasts={toasts} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts }: { toasts: Toast[] }) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "glass rounded-xl px-4 py-3 text-popover-foreground",
            "animate-in fade-in slide-in-from-bottom-2",
          )}
        >
          <div className="text-sm font-medium">{toast.title}</div>
          {toast.description ? <div className="mt-1 text-xs text-muted-foreground">{toast.description}</div> : null}
        </div>
      ))}
    </div>,
    document.body,
  );
}

export function useToast() {
  const value = React.useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return value;
}

export function Toaster() {
  return null;
}
