"use client";

import { useAppStore, type View } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BookOpenText, SpellCheck } from "lucide-react";

const LEARN_TABS: { view: View; label: string; devanagari: string }[] = [
  { view: "alphabet", label: "Alphabet", devanagari: "वर्णमाला" },
  { view: "words", label: "Basic Words", devanagari: "शब्दाः" },
  { view: "sentences", label: "Sentences", devanagari: "वाक्यानि" },
  { view: "vocabulary", label: "Vocabulary", devanagari: "पारिभाषिकम्" },
  { view: "quiz", label: "Quiz", devanagari: "प्रश्नोत्तरम्" },
];

export function LearningLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const { view, navigate } = useAppStore();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Learn nav tabs */}
      <nav
        className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border/70 bg-card p-1.5"
        aria-label="Learning sections"
      >
        {LEARN_TABS.map((tab) => {
          const active = view === tab.view;
          const Icon = tab.view === "quiz" ? SpellCheck : BookOpenText;
          return (
            <button
              key={tab.view}
              onClick={() => navigate(tab.view)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span
                className={cn(
                  "font-devanagari text-xs",
                  active ? "opacity-80" : "text-muted-foreground/70"
                )}
              >
                {tab.devanagari}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-muted-foreground">{description}</p>
      </div>

      {children}
    </div>
  );
}
