"use client";

import { useCallback, useEffect, useState } from "react";
import { LearningLayout } from "./learning-layout";
import { QUIZ_BANK, type QuizQuestion } from "../learn-data";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronRight,
  History,
  Medal,
  RotateCcw,
  SpellCheck,
  Trophy,
  XCircle,
} from "lucide-react";

type Phase = "start" | "question" | "done";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const QUIZ_LENGTH = 8;

type Attempt = {
  id: string;
  topic: string;
  score: number;
  total: number;
  createdAt: string;
};

export function QuizView() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("start");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/quiz/attempts", { cache: "no-store" });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setAttempts(data.attempts ?? []);
        }
      } catch {
        /* non-fatal */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const startQuiz = () => {
    setQuestions(shuffle(QUIZ_BANK).slice(0, QUIZ_LENGTH));
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setPhase("question");
  };

  const saveAttemptToAccount = useCallback(
    async (finalScore: number, total: number) => {
      if (!user || total === 0) return;
      try {
        const res = await fetch("/api/quiz/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: "Sanskrit Basics",
            score: finalScore,
            total,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setAttempts((list) => [data.attempt, ...list]);
        }
      } catch {
        /* non-fatal */
      }
    },
    [user]
  );

  const answer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === questions[current].answer) {
      setScore((s) => s + 1);
    }
  };

  const next = () => {
    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
      setSelected(null);
    } else {
      const finalScore = score;
      setPhase("done");
      saveAttemptToAccount(finalScore, questions.length);
    }
  };

  const q = questions[current];
  const progressPct = phase === "done" ? 100 : (current / questions.length) * 100;

  return (
    <LearningLayout
      title="Interactive Sanskrit Quiz"
      description="Test what you have learned — alphabet recognition, word meanings, sentence translation and inscription vocabulary. 8 questions per round, instant feedback with explanations."
    >
      {phase === "start" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Card className="bg-parchment">
            <CardContent className="flex flex-col items-center gap-5 p-10 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <SpellCheck className="h-10 w-10" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold">Ready to begin?</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {QUIZ_LENGTH} questions drawn from the full learning module — alphabet,
                  basic words, sentences, vocabulary and inscription formulas. You get
                  an explanation after every answer.
                </p>
              </div>
              <Button size="lg" onClick={startQuiz} className="gap-2">
                <Trophy className="h-4 w-4" /> Start Quiz
              </Button>
              {!user && (
                <p className="text-xs text-muted-foreground">
                  Tip: login to save your scores and track progress.
                </p>
              )}
            </CardContent>
          </Card>

          {user && (
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4 text-primary" /> Recent Attempts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attempts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No attempts yet — your scores will appear here.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {attempts.slice(0, 6).map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {new Date(a.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                        <span className="font-semibold text-primary">
                          {a.score}/{a.total}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {phase === "question" && q && (
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="secondary">{q.topic}</Badge>
              <span className="text-sm font-medium text-muted-foreground">
                Question {current + 1} / {questions.length}
              </span>
            </div>
            <Progress value={progressPct} className="mt-3 h-1.5" />
          </CardHeader>
          <CardContent className="space-y-6">
            <h2 className="text-lg font-semibold leading-relaxed">{q.question}</h2>
            <div className="grid gap-2.5" role="group" aria-label="Answer options">
              {q.options.map((opt, idx) => {
                const isCorrect = idx === q.answer;
                const isChosen = idx === selected;
                const answered = selected !== null;
                return (
                  <button
                    key={idx}
                    onClick={() => answer(idx)}
                    disabled={answered}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
                      !answered && "border-border hover:border-primary/60 hover:bg-muted/50",
                      answered && isCorrect && "border-primary bg-secondary text-primary",
                      answered && isChosen && !isCorrect && "border-destructive bg-destructive/10 text-destructive",
                      answered && !isChosen && !isCorrect && "border-border opacity-50"
                    )}
                  >
                    <span className={cn(isChosen || isCorrect ? "" : "")}>{opt}</span>
                    {answered && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                    {answered && isChosen && !isCorrect && <XCircle className="h-5 w-5 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {selected !== null && (
              <div className="rounded-xl border border-primary/30 bg-secondary/50 p-4">
                <p className="text-sm font-semibold">
                  {selected === q.answer ? "Correct!" : "Not quite."}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {q.explanation}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Score: <span className="font-semibold text-primary">{score}</span>
              </p>
              <Button onClick={next} disabled={selected === null} className="gap-2">
                {current + 1 === questions.length ? "See Results" : "Next"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "done" && (
        <Card className="mx-auto max-w-lg bg-parchment">
          <CardContent className="flex flex-col items-center gap-5 p-10 text-center">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Medal className="h-12 w-12" />
            </span>
            <div>
              <h2 className="font-display text-3xl font-bold">
                {score} / {questions.length}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {score === questions.length
                  ? "Perfect! शोभनम्! You are ready for real inscriptions."
                  : score >= questions.length * 0.7
                  ? "Well done — साधु साधु! A strong grasp of the basics."
                  : "Keep practising — revisit the Alphabet and Vocabulary sections."}
              </p>
            </div>
            {user ? (
              <p className="text-xs text-muted-foreground">
                This attempt has been saved to your profile.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Login to save your scores and track progress over time.
              </p>
            )}
            <div className="flex gap-2">
              <Button onClick={startQuiz} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </LearningLayout>
  );
}
