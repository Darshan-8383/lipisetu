"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultPanel } from "./result-panel";
import { ArrowLeft, FileX2, ScrollText } from "lucide-react";

type FullTranslation = {
  id: string;
  title: string;
  originalImage: string;
  enhancedImage: string | null;
  translatedImage: string | null;
  engine: string | null;
  sanskritText: string;
  transliteration: string | null;
  englishTranslation: string | null;
  kannadaTranslation: string | null;
  notes: string | null;
  createdAt: string;
};

export function TranslationDetailView() {
  const { user, translationId, navigate } = useAppStore();
  const [translation, setTranslation] = useState<FullTranslation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user || !translationId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`/api/translations/${translationId}`, { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setTranslation(data.translation);
        } else {
          setNotFound(true);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, translationId]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold">Please login to view saved results</h1>
        <Button className="mt-6" onClick={() => navigate("login")}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 gap-2 text-muted-foreground"
        onClick={() => navigate("history")}
      >
        <ArrowLeft className="h-4 w-4" /> Back to My History
      </Button>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-9 w-1/2" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : notFound || !translation ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border p-14 text-center">
          <FileX2 className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="font-medium">Result not found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This translation does not exist or belongs to another account.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("history")} className="gap-2">
            <ScrollText className="h-4 w-4" /> Back to History
          </Button>
        </div>
      ) : (
        <ResultPanel
          title={translation.title}
          createdAt={translation.createdAt}
          originalImage={translation.originalImage}
          enhancedImage={translation.enhancedImage}
          sanskritText={translation.sanskritText}
          transliteration={translation.transliteration}
          englishTranslation={translation.englishTranslation}
          kannadaTranslation={translation.kannadaTranslation}
          notes={translation.notes}
          engine={translation.engine}
          translatedImage={translation.translatedImage}
        />
      )}
    </div>
  );
}
