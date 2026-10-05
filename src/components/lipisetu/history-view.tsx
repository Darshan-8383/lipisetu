"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  CalendarDays,
  Eye,
  History,
  ScrollText,
  Search,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";

type TranslationListItem = {
  id: string;
  title: string;
  thumbnail: string | null;
  sanskritText: string;
  englishTranslation: string | null;
  kannadaTranslation: string | null;
  saved: boolean;
  createdAt: string;
};

export function HistoryView() {
  const { user, navigate } = useAppStore();
  const { toast } = useToast();
  const [translations, setTranslations] = useState<TranslationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/translations", { cache: "no-store" });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setTranslations(data.translations ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <History className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h1 className="mt-4 font-display text-2xl font-bold">My Translation History</h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Login to see your personal translation history. Each account can only see
          its own results.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={() => navigate("login")}>Login</Button>
          <Button variant="outline" onClick={() => navigate("register")}>
            Register
          </Button>
        </div>
      </div>
    );
  }

  const filtered = translations.filter((t) =>
    query.trim()
      ? [t.title, t.sanskritText, t.englishTranslation ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      : true
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/translations/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setTranslations((list) => list.filter((t) => t.id !== deleteId));
        toast({ title: "Deleted", description: "The translation was removed from your history." });
      } else {
        toast({
          title: "Could not delete",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">My Translation History</h1>
          <p className="mt-1 text-muted-foreground">
            Your personal archive of saved inscription translations.
          </p>
        </div>
        <Button onClick={() => navigate("translator")} className="gap-2">
          <ScrollText className="h-4 w-4" /> New Translation
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, Sanskrit text or English translation…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex gap-4 p-4">
                <Skeleton className="h-20 w-20 rounded-lg" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <History className="h-10 w-10 text-muted-foreground/50" />
            {translations.length === 0 ? (
              <>
                <div>
                  <p className="font-medium">Your history is empty</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Translate an inscription and save the result to see it here.
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate("translator")}>
                  Translate an Inscription
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No results match &ldquo;{query}&rdquo;.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((t, i) => (
            <Card key={t.id} className="transition-all hover:border-primary/40 hover:shadow-sm">
              <CardContent className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-sm font-bold text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {t.thumbnail ? (
                   
                  <img
                    src={t.thumbnail}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-lg border border-border/60 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-muted-foreground">
                    <ScrollText className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{t.title}</p>
                  <p className="font-devanagari mt-0.5 line-clamp-2 text-sm leading-snug text-muted-foreground">
                    {t.sanskritText.split("\n")[0]}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(t.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => navigate("translation", { translationId: t.id })}
                  >
                    <Eye className="h-3.5 w-3.5" /> View Result
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(t.id)}
                    aria-label={`Delete ${t.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this translation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the saved result from your history. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleting}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
