"use client";

import { useState } from "react";
import { LearningLayout } from "./learning-layout";
import { VOCABULARY } from "../learn-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hash, Landmark, Palette, Users, Zap } from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Hash,
  Palette,
  Landmark,
  Zap,
};

export function VocabularyView() {
  const firstCategory = VOCABULARY[0]?.category ?? "";
  const [active, setActive] = useState(firstCategory);
  const group = VOCABULARY.find((g) => g.category === active) ?? VOCABULARY[0];
  const Icon = ICONS[group.icon] ?? Landmark;

  return (
    <LearningLayout
      title="Sanskrit Vocabulary"
      description="Thematic word lists — family, numbers, colours, inscription formulas and common verbs — each with IAST transliteration, English and Kannada meanings."
    >
      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        {/* Category sidebar */}
        <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible" aria-label="Vocabulary categories">
          {VOCABULARY.map((g) => {
            const GIcon = ICONS[g.icon] ?? Landmark;
            const isActive = g.category === group.category;
            return (
              <button
                key={g.category}
                onClick={() => setActive(g.category)}
                className={
                  "flex shrink-0 items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all " +
                  (isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground")
                }
              >
                <GIcon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{g.category}</span>
                <span
                  className={
                    "ml-auto hidden text-xs " +
                    (isActive ? "opacity-75" : "text-muted-foreground/70") +
                    " md:inline"
                  }
                >
                  {g.items.length}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Word table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Icon className="h-5 w-5 text-primary" />
              {group.category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto scroll-elegant">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2.5 pr-4 font-semibold">Sanskrit</th>
                    <th className="pb-2.5 pr-4 font-semibold">IAST</th>
                    <th className="pb-2.5 pr-4 font-semibold">English</th>
                    <th className="font-devanagari pb-2.5 font-semibold">ಕನ್ನಡ</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item) => (
                    <tr
                      key={item.devanagari + item.iast}
                      className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40"
                    >
                      <td className="font-devanagari py-3 pr-4 text-lg">{item.devanagari}</td>
                      <td className="font-iast py-3 pr-4 italic text-muted-foreground">
                        {item.iast}
                      </td>
                      <td className="py-3 pr-4">{item.english}</td>
                      <td className="font-kannada py-3 text-base">{item.kannada}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </LearningLayout>
  );
}
