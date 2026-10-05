"use client";

import { useState } from "react";
import { LearningLayout } from "./learning-layout";
import { BASIC_WORDS } from "../learn-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", ...Array.from(new Set(BASIC_WORDS.map((w) => w.category)))];

export function WordsView() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const words = BASIC_WORDS.filter((w) => {
    const matchCategory = category === "All" || w.category === category;
    const matchQuery = query.trim()
      ? [w.devanagari, w.iast, w.english, w.kannada]
          .join(" ")
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      : true;
    return matchCategory && matchQuery;
  });

  return (
    <LearningLayout
      title="Basic Sanskrit Words"
      description="Essential Sanskrit vocabulary with English and Kannada meanings — the building blocks you will meet again and again in inscriptions and texts."
    >
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Word categories">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search words…"
          className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none transition-colors focus:border-primary sm:w-64"
          aria-label="Search words"
        />
      </div>

      {/* Word grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {words.map((w) => (
          <div
            key={w.devanagari}
            className="group rounded-xl border border-border/70 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-devanagari text-3xl font-medium text-foreground group-hover:text-primary">
                {w.devanagari}
              </p>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {w.category}
              </Badge>
            </div>
            <p className="font-iast mt-1 text-sm italic text-muted-foreground">{w.iast}</p>
            <div className="mt-3 space-y-1 border-t border-border/60 pt-3 text-sm">
              <p className="flex gap-2">
                <span className="w-14 shrink-0 text-xs font-semibold uppercase text-muted-foreground">
                  English
                </span>
                <span>{w.english}</span>
              </p>
              <p className="font-kannada flex gap-2">
                <span className="w-14 shrink-0 pt-0.5 text-xs font-semibold uppercase text-muted-foreground">
                  ಕನ್ನಡ
                </span>
                <span>{w.kannada}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {words.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No words match your search.
        </p>
      )}
    </LearningLayout>
  );
}
