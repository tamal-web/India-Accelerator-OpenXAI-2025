// theme-toggle.tsx
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Force initial state to match system preference
    if (mounted && resolvedTheme) {
      setTheme(resolvedTheme);
    }
  }, [mounted, resolvedTheme, setTheme]);

  if (!mounted) {
    return (
      <Button className="" variant={"outline"} disabled>
        <div className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center">
      <Button
        className=""
        variant={"outline"}
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        title={
          resolvedTheme === "dark"
            ? "Switch to light mode"
            : "Switch to dark mode"
        }
      >
        {resolvedTheme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
