"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getApiKey,
  hasApiKeyOverride,
  maskKey,
  prettyModelName,
  setApiKeyOverride,
  testGeminiConnection,
} from "@/lib/gemini";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AlertCircle,
  CalendarDays,
  Camera,
  CheckCircle2,
  FileQuestion,
  KeyRound,
  Languages,
  Loader2,
  LogOut,
  Mail,
  PlugZap,
  Sparkles,
  UserRound,
} from "lucide-react";

type Attempt = {
  id: string;
  topic: string;
  score: number;
  total: number;
  createdAt: string;
};

export function ProfileView() {
  const { user, navigate, setUser } = useAppStore();
  const [translationCount, setTranslationCount] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  // Gemini engine status
  const [engineTest, setEngineTest] = useState<"idle" | "testing" | "ok" | "error">(
    "idle"
  );
  const [engineResult, setEngineResult] = useState<string | null>(null);
  const [keyOverride, setKeyOverride] = useState("");
  const [keyMask, setKeyMask] = useState("");
  const [usingOverride, setUsingOverride] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setKeyMask(maskKey(getApiKey()));
      setUsingOverride(hasApiKeyOverride());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [tRes, qRes] = await Promise.all([
          fetch("/api/translations", { cache: "no-store" }),
          fetch("/api/quiz/attempts", { cache: "no-store" }),
        ]);
        if (!cancelled) {
          if (tRes.ok) {
            const data = await tRes.json();
            setTranslationCount(data.translations?.length ?? 0);
          }
          if (qRes.ok) {
            const data = await qRes.json();
            setAttempts(data.attempts ?? []);
          }
        }
      } catch {
        /* non-fatal */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <UserRound className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h1 className="mt-4 font-display text-2xl font-bold">Profile</h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Login to view your profile, activity summary and quiz history.
        </p>
        <Button className="mt-6" onClick={() => navigate("login")}>
          Go to Login
        </Button>
      </div>
    );
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    navigate("home");
  };

  const runEngineTest = async () => {
    setEngineTest("testing");
    setEngineResult(null);
    const r = await testGeminiConnection();
    if (r.ok) {
      setEngineTest("ok");
      setEngineResult(
        `Connected — ${prettyModelName(r.textModel)} engine handles OCR & translation` +
          (r.imageModel
            ? `, and the image engine creates the translated images.`
            : ". No image-generation model found for this key — the clean translation card is still available.")
      );
    } else {
      setEngineTest("error");
      setEngineResult(r.error);
    }
  };

  const saveKeyOverride = () => {
    setApiKeyOverride(keyOverride.trim() || null);
    setKeyOverride("");
    setKeyMask(maskKey(getApiKey()));
    setUsingOverride(hasApiKeyOverride());
    setEngineTest("idle");
    setEngineResult(null);
  };

  const bestQuiz = attempts.length
    ? Math.max(...attempts.map((a) => Math.round((a.score / a.total) * 100)))
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-3xl font-bold">My Profile</h1>

      <div className="grid gap-5 md:grid-cols-[1fr_300px]">
        {/* Account info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" /> Account
            </CardTitle>
            <CardDescription>Your LipiSetu identity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="font-display text-xl font-bold">{user.name}</p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  Member since{" "}
                  {new Date(user.createdAt).toLocaleDateString("en-IN", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-border/60 pt-4">
              <div className="rounded-xl border border-border/70 p-3 text-center">
                <Languages className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-1.5 font-display text-xl font-bold">
                  {translationCount ?? "…"}
                </p>
                <p className="text-xs text-muted-foreground">Translations</p>
              </div>
              <div className="rounded-xl border border-border/70 p-3 text-center">
                <FileQuestion className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-1.5 font-display text-xl font-bold">{attempts.length}</p>
                <p className="text-xs text-muted-foreground">Quizzes</p>
              </div>
              <div className="rounded-xl border border-border/70 p-3 text-center">
                <Camera className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-1.5 font-display text-xl font-bold">
                  {bestQuiz !== null ? `${bestQuiz}%` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Best score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions + quiz history */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" onClick={() => navigate("translator")} className="justify-start gap-2">
                <Camera className="h-4 w-4" /> New Translation
              </Button>
              <Button variant="outline" onClick={() => navigate("history")} className="justify-start gap-2">
                <Languages className="h-4 w-4" /> My History
              </Button>
              <Button variant="outline" onClick={() => navigate("dashboard")} className="justify-start gap-2">
                <UserRound className="h-4 w-4" /> Dashboard
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Logout from LipiSetu?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You can login again anytime — your saved translations and quiz
                      history will be waiting for you.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quiz History</CardTitle>
            </CardHeader>
            <CardContent>
              {attempts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No quiz attempts yet.{" "}
                  <button
                    className="font-medium text-primary hover:underline"
                    onClick={() => navigate("quiz")}
                  >
                    Take the quiz →
                  </button>
                </p>
              ) : (
                <ul className="max-h-64 space-y-2 overflow-y-auto scroll-elegant">
                  {attempts.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm"
                    >
                      <div>
                        <Badge variant="secondary" className="text-[10px]">
                          {a.topic}
                        </Badge>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(a.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <span className="font-display font-bold text-primary">
                        {a.score}/{a.total}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Engine — OCR */}
      <Card className="mt-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> AI Engine — OCR
            <Badge variant="secondary" className="ml-1 gap-1">
              OCR
            </Badge>
          </CardTitle>
          <CardDescription>
            Image processing (OCR), translation and translated-image generation
            run on your own API key. Calls go directly from your browser
            to Google — the key never reaches the LipiSetu server. If the OCR engine is
            unavailable, LipiSetu automatically falls back to its built-in
            engine.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-muted/30 p-3">
            <KeyRound className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                API key {usingOverride ? "(personal override)" : "(app config)"}
              </p>
              <p className="truncate font-mono text-sm">{keyMask || "—"}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={runEngineTest}
              disabled={engineTest === "testing"}
            >
              {engineTest === "testing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlugZap className="h-4 w-4" />
              )}
              Test Connection
            </Button>
          </div>

          {engineTest === "ok" && (
            <Alert className="border-primary/30 bg-secondary/50">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription>{engineResult}</AlertDescription>
            </Alert>
          )}
          {engineTest === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{engineResult}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Use a different key (optional)
              </p>
              <Input
                value={keyOverride}
                onChange={(e) => setKeyOverride(e.target.value)}
                placeholder="Paste an API key (AI Studio)…"
                type="password"
                autoComplete="off"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={saveKeyOverride}
                disabled={keyOverride.trim().length <= 10}
              >
                Save Key
              </Button>
              {usingOverride && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setApiKeyOverride(null);
                    setKeyMask(maskKey(getApiKey()));
                    setUsingOverride(false);
                    setEngineTest("idle");
                    setEngineResult(null);
                  }}
                >
                  Remove Override
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Get a free key at Google AI Studio (aistudio.google.com/apikey).
            Overrides are stored only in this browser.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
