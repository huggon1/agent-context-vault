import { Moon, Sun } from "lucide-react";
import * as React from "react";
import { Button } from "./ui/button";

function getInitialDarkMode() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeToggle() {
  const [dark, setDark] = React.useState(getInitialDarkMode);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => setDark((value) => !value)}
      aria-label="Toggle theme"
      className="relative overflow-hidden"
    >
      <Sun
        className={`absolute h-4 w-4 transition-all duration-300 ${
          dark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
        }`}
      />
      <Moon
        className={`absolute h-4 w-4 transition-all duration-300 ${
          dark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0"
        }`}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
