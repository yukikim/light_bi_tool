import type { ReactNode } from "react";

export function WidgetContainer({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {children}
    </div>
  );
}
