"use client";

import { useState } from "react";
import { LearningLayout } from "./learning-layout";
import { ALPHABET } from "../learn-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shuffle, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/** Speak a letter using the browser's speech synthesis (best effort). */
function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "hi-IN";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function AlphabetView() {
  const { toast } = useToast();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(ALPHABET.map((g, i) => [g.title, i < 2]))
  );

  const randomLetter = () => {
    const all = ALPHABET.flatMap((g) => g.letters);
    const letter = all[Math.floor(Math.random() * all.length)];
    toast({
      title: `${letter.devanagari} (${letter.iast})`,
      description: `Kannada: ${letter.kannada} · ${letter.hint}`,
    });
  };

  return (
    <LearningLayout
      title="Sanskrit Alphabet — वर्णमाला"
      description="The Sanskrit varṇamālā (garland of letters): 13 vowels and 33 consonants grouped by articulation, each shown with its IAST transliteration, Kannada equivalent and a pronunciation hint."
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Click any letter to hear it (if your browser supports Sanskrit/Hindi speech).
        </p>
        <Button variant="outline" size="sm" onClick={randomLetter} className="gap-2 shrink-0">
          <Shuffle className="h-4 w-4" /> Random Letter
        </Button>
      </div>

      <div className="space-y-5">
        {ALPHABET.map((group) => {
          const open = openGroups[group.title] ?? true;
          return (
            <Card key={group.title}>
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() =>
                  setOpenGroups((s) => ({ ...s, [group.title]: !s[group.title] }))
                }
                aria-expanded={open}
              >
                <div>
                  <h2 className="font-devanagari text-lg font-semibold text-primary">
                    {group.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{group.subtitle}</p>
                </div>
                <Badge variant="secondary">{group.letters.length} letters</Badge>
              </button>
              {open && (
                <CardContent className="grid grid-cols-2 gap-3 border-t border-border/60 pt-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
                  {group.letters.map((letter) => (
                    <button
                      key={letter.devanagari + letter.iast}
                      onClick={() => speak(letter.devanagari)}
                      className="group rounded-xl border border-border/70 bg-card p-3 text-center transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                      title={`${letter.iast} — ${letter.hint}`}
                    >
                      <p className="font-devanagari text-4xl font-medium leading-tight text-foreground transition-colors group-hover:text-primary">
                        {letter.devanagari}
                      </p>
                      <p className="font-iast mt-1 text-xs italic text-muted-foreground">
                        {letter.iast}
                      </p>
                      <p className="font-kannada mt-1 text-sm text-primary/70">{letter.kannada}</p>
                      <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground/80">
                        <Volume2 className="mr-0.5 inline h-3 w-3" />
                        {letter.hint}
                      </p>
                    </button>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </LearningLayout>
  );
}
