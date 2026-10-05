"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  Camera,
  FileQuestion,
  GraduationCap,
  History,
  Languages,
  Medal,
  ScrollText,
  Sparkles,
} from "lucide-react";

type TranslationListItem = {
  id: string;
  title: string;
  thumbnail: string | null;
  sanskritText: string;
  englishTranslation: string | null;
  createdAt: string;
};

type QuizAttempt = {
  id: string;
  topic: string;
  score: number;
  total: number;
  createdAt: string;
};

export function DashboardView() {
  const { user, navigate } = useAppStore();
  const [translations, setTranslations] = useState<TranslationListItem[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [tRes, qRes] = await Promise.all([
          fetch("/api/translations", { cache: "no-store" }),
          fetch("/api/quiz/attempts", { cache: "no-store" }),
        ]);
        if (tRes.ok && !cancelled) {
          const data = await tRes.json();
          setTranslations(data.translations ?? []);
        }
        if (qRes.ok && !cancelled) {
          const data = await qRes.json();
          setAttempts(data.attempts ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold">Please login to view your dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Your dashboard shows saved translations and quiz progress.
        </p>
        <Button className="mt-6" onClick={() => navigate("login")}>
          Go to Login
        </Button>
      </div>
    );
  }

  const bestQuiz = attempts.length
    ? Math.max(...attempts.map((a) => Math.round((a.score / a.total) * 100)))
    : null;

  const stats = [
    {
      label: "Translations",
      value: translations.length,
      icon: Languages,
      onClick: () => navigate("history"),
    },
    {
      label: "Quiz attempts",
      value: attempts.length,
      icon: FileQuestion,
      onClick: () => navigate("quiz"),
    },
    {
      label: "Best quiz score",
      value: bestQuiz !== null ? `${bestQuiz}%` : "—",
      icon: Medal,
      onClick: () => navigate("quiz"),
    },
  ];

  const quickActions = [
    {
      title: "Translate an Inscription",
      description: "Upload a photo and run the full OCR + translation pipeline.",
      icon: Camera,
      view: "translator" as const,
    },
    {
      title: "Review My History",
      description: "Open saved translations and revisit their results.",
      icon: History,
      view: "history" as const,
    },
    {
      title: "Learn Sanskrit",
      description: "Alphabet, words, sentences and vocabulary with Kannada meanings.",
      icon: GraduationCap,
      view: "alphabet" as const,
    },
    {
      title: "Take the Quiz",
      description: "Test your Sanskrit knowledge with the interactive quiz.",
      icon: Sparkles,
      view: "quiz" as const,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Welcome */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-devanagari text-lg text-primary">नमस्ते</p>
          <h1 className="font-display text-3xl font-bold">Welcome back, {user.name}</h1>
          <p className="mt-1 text-muted-foreground">
            Here is an overview of your LipiSetu activity.
          </p>
        </div>
        <Button onClick={() => navigate("translator")} className="gap-2">
          <Camera className="h-4 w-4" /> New Translation
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card
            key={s.label}
            className="cursor-pointer transition-all hover:border-primary/40 hover:shadow-md"
            onClick={s.onClick}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-6 w-6" />
              </span>
              <div>
                <div className="font-display text-2xl font-bold leading-none">
                  {loading ? <Skeleton className="h-7 w-12" /> : s.value}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Recent translations */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-primary" />
                Recent Translations
              </CardTitle>
              <CardDescription>Your latest saved inscription results.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-primary"
              onClick={() => navigate("history")}
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : translations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-8 text-center">
                <ScrollText className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No translations yet — upload your first inscription!
                </p>
                <Button size="sm" variant="outline" onClick={() => navigate("translator")}>
                  Start Translating
                </Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {translations.slice(0, 4).map((t, i) => (
                  <li key={t.id}>
                    <button
                      className="flex w-full items-center gap-4 rounded-xl border border-border/70 p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
                      onClick={() => navigate("translation", { translationId: t.id })}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {t.thumbnail ? (
                         
                        <img
                          src={t.thumbnail}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-lg border border-border/60 object-cover"
                        />
                      ) : null}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{t.title}</span>
                        <span className="font-devanagari block truncate text-sm text-muted-foreground">
                          {t.sanskritText.split("\n")[0]}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {new Date(t.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2.5">
              {quickActions.map((a) => (
                <button
                  key={a.title}
                  onClick={() => navigate(a.view)}
                  className="flex items-start gap-3 rounded-lg border border-border/70 p-3 text-left transition-all hover:border-primary/40 hover:bg-muted/40"
                >
                  <a.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>
                    <span className="block text-sm font-semibold">{a.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {a.description}
                    </span>
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Latest quiz */}
          {attempts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Latest Quiz</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                  <div>
                    <Badge variant="secondary">{attempts[0].topic}</Badge>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {new Date(attempts[0].createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <p className="font-display text-2xl font-bold text-primary">
                    {attempts[0].score}/{attempts[0].total}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
