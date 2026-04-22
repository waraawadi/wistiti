"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type AppNameProps = {
  className?: string;
  as?: "span" | "h1" | "p";
};

export function AppName({ className, as: Comp = "span" }: AppNameProps) {
  const appName = useAppStore((s) => s.appName);
  return <Comp className={cn("font-semibold tracking-tight", className)}>{appName}</Comp>;
}
