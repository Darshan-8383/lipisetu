"use client";

import { LearningLayout } from "./learning-layout";
import { SIMPLE_SENTENCES } from "../learn-data";

export function SentencesView() {
  return (
    <LearningLayout
      title="Simple Sanskrit Sentences"
      description="Read Sanskrit the way inscriptions and primers present it — short, complete sentences with Devanagari, IAST transliteration, English and Kannada translations."
    >
      <div className="space-y-4">
        {SIMPLE_SENTENCES.map((s, i) => (
          <div
            key={s.devanagari}
            className="overflow-hidden rounded-xl border border-border/70 bg-card transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex items-center gap-3 border-b border-border/60 bg-muted/40 px-5 py-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sentence
              </span>
            </div>
            <div className="grid gap-0 md:grid-cols-2">
              <div className="border-b border-border/50 p-5 md:border-b-0 md:border-r">
                <p className="font-devanagari text-2xl leading-relaxed">{s.devanagari}</p>
                <p className="font-iast mt-2 text-sm italic text-muted-foreground">{s.iast}</p>
              </div>
              <div className="space-y-3 p-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    English
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed">{s.english}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    ಕನ್ನಡ
                  </p>
                  <p className="font-kannada mt-0.5 text-base leading-relaxed">{s.kannada}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </LearningLayout>
  );
}
