"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LipiSetuLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const navigate = useAppStore((s) => s.navigate);
  const devSize = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl";
  const enSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg";

  return (
    <button
      onClick={() => navigate("home")}
      className="flex items-center gap-2.5 group text-left"
      aria-label="LipiSetu home"
    >
      <span className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
        <span className="font-devanagari text-xl font-semibold leading-none pt-0.5">लि</span>
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
          से
        </span>
      </span>
      <span className="flex flex-col leading-tight">
        <span className={cn("font-devanagari font-semibold text-primary", devSize)}>
          लिपिसेतु
        </span>
        <span className={cn("font-display font-bold tracking-tight text-foreground", enSize)}>
          LipiSetu
        </span>
      </span>
    </button>
  );
}
