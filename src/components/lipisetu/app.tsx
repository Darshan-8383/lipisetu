"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Header } from "./header";
import { Footer } from "./footer";
import { HomeView } from "./home-view";
import { AuthView } from "./auth-view";
import { DashboardView } from "./dashboard-view";
import { TranslatorView } from "./translator-view";
import { HistoryView } from "./history-view";
import { TranslationDetailView } from "./translation-detail-view";
import { ProfileView } from "./profile-view";
import { AlphabetView } from "./learn/alphabet-view";
import { WordsView } from "./learn/words-view";
import { SentencesView } from "./learn/sentences-view";
import { VocabularyView } from "./learn/vocabulary-view";
import { QuizView } from "./learn/quiz-view";
import { AiAssistant } from "./ai-assistant";

export function LipiSetuApp() {
  const { view, authChecked, refreshUser } = useAppStore();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 py-24">
            <span className="font-devanagari text-3xl text-primary">लिपिसेतु</span>
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Opening the bridge…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {view === "home" && <HomeView />}
        {view === "login" && <AuthView mode="login" />}
        {view === "register" && <AuthView mode="register" />}
        {view === "dashboard" && <DashboardView />}
        {view === "translator" && <TranslatorView />}
        {view === "history" && <HistoryView />}
        {view === "translation" && <TranslationDetailView />}
        {view === "alphabet" && <AlphabetView />}
        {view === "words" && <WordsView />}
        {view === "sentences" && <SentencesView />}
        {view === "vocabulary" && <VocabularyView />}
        {view === "quiz" && <QuizView />}
        {view === "profile" && <ProfileView />}
      </main>
      <Footer />
      <AiAssistant />
    </div>
  );
}
